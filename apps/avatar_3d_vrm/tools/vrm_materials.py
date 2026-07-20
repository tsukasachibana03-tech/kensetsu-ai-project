from __future__ import annotations

import argparse
import io
import json
import pathlib
import struct
import zlib


def read_glb(path: pathlib.Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    magic, _version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or total_length != len(data):
        raise ValueError(f"{path} is not a valid GLB/VRM file")

    offset = 12
    json_chunk = None
    bin_chunk = b""
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == b"JSON":
            json_chunk = chunk
        elif chunk_type == b"BIN\x00":
            bin_chunk = chunk

    if json_chunk is None:
        raise ValueError(f"{path} has no JSON chunk")
    return json.loads(json_chunk.decode("utf-8")), bin_chunk


def write_glb(path: pathlib.Path, gltf: dict, bin_chunk: bytes) -> None:
    json_bytes = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_padding = (4 - len(json_bytes) % 4) % 4
    json_chunk = json_bytes + (b" " * json_padding)

    bin_padding = (4 - len(bin_chunk) % 4) % 4
    padded_bin = bin_chunk + (b"\x00" * bin_padding)

    total_length = 12 + 8 + len(json_chunk)
    if padded_bin:
        total_length += 8 + len(padded_bin)

    parts = [struct.pack("<4sII", b"glTF", 2, total_length)]
    parts.append(struct.pack("<I4s", len(json_chunk), b"JSON"))
    parts.append(json_chunk)
    if padded_bin:
        parts.append(struct.pack("<I4s", len(padded_bin), b"BIN\x00"))
        parts.append(padded_bin)
    path.write_bytes(b"".join(parts))


def list_materials(path: pathlib.Path) -> None:
    gltf, _bin = read_glb(path)
    for index, material in enumerate(gltf.get("materials", [])):
        pbr = material.get("pbrMetallicRoughness", {})
        color = pbr.get("baseColorFactor")
        texture = pbr.get("baseColorTexture")
        print(f"{index:02d} | {material.get('name', '')} | color={color} | texture={texture}")


def list_images(path: pathlib.Path) -> None:
    gltf, _bin = read_glb(path)
    for index, image in enumerate(gltf.get("images", [])):
        print(
            f"{index:02d} | {image.get('name', '')} | "
            f"mime={image.get('mimeType')} | bufferView={image.get('bufferView')}"
        )


def apply_field_style(source: pathlib.Path, output: pathlib.Path) -> None:
    gltf, bin_chunk = read_glb(source)

    # Conservative material-color pass. It leaves mesh, bones, hair, and face untouched.
    palette_by_keyword = {
        "Tops": [0.22, 0.78, 0.82, 1.0],
        "Bottoms": [0.86, 0.88, 0.90, 1.0],
        "Shoes": [0.10, 0.16, 0.18, 1.0],
    }

    for material in gltf.get("materials", []):
        name = material.get("name", "")
        for keyword, color in palette_by_keyword.items():
            if keyword in name:
                pbr = material.setdefault("pbrMetallicRoughness", {})
                pbr["baseColorFactor"] = color
                pbr.setdefault("metallicFactor", 0)
                pbr.setdefault("roughnessFactor", 0.85)
                break

    output.parent.mkdir(parents=True, exist_ok=True)
    write_glb(output, gltf, bin_chunk)
    print(output)


def png_unfilter(raw: bytes, width: int, height: int, channels: int, bit_depth: int) -> bytearray:
    if bit_depth != 8:
        raise ValueError("Only 8-bit PNG textures are supported")
    stride = width * channels
    rows = bytearray(height * stride)
    pos = 0
    for y in range(height):
        filter_type = raw[pos]
        pos += 1
        row = bytearray(raw[pos : pos + stride])
        pos += stride
        previous = rows[(y - 1) * stride : y * stride] if y else bytearray(stride)
        for x in range(stride):
            left = row[x - channels] if x >= channels else 0
            up = previous[x]
            up_left = previous[x - channels] if x >= channels else 0
            if filter_type == 1:
                row[x] = (row[x] + left) & 0xFF
            elif filter_type == 2:
                row[x] = (row[x] + up) & 0xFF
            elif filter_type == 3:
                row[x] = (row[x] + ((left + up) // 2)) & 0xFF
            elif filter_type == 4:
                pa = abs(up - up_left)
                pb = abs(left - up_left)
                pc = abs(left + up - 2 * up_left)
                predictor = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                row[x] = (row[x] + predictor) & 0xFF
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter {filter_type}")
        rows[y * stride : (y + 1) * stride] = row
    return rows


def read_png_rgba(data: bytes) -> tuple[int, int, bytearray]:
    stream = io.BytesIO(data)
    if stream.read(8) != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Texture is not a PNG")

    width = height = bit_depth = color_type = None
    idat = bytearray()
    while True:
        length_data = stream.read(4)
        if not length_data:
            break
        length = struct.unpack(">I", length_data)[0]
        chunk_type = stream.read(4)
        chunk_data = stream.read(length)
        stream.read(4)
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _compression, _filter, _interlace = struct.unpack(
                ">IIBBBBB", chunk_data
            )
        elif chunk_type == b"IDAT":
            idat.extend(chunk_data)
        elif chunk_type == b"IEND":
            break

    if width is None or height is None or bit_depth is None or color_type is None:
        raise ValueError("Invalid PNG")
    channels_by_color = {2: 3, 6: 4}
    if color_type not in channels_by_color:
        raise ValueError(f"Unsupported PNG color type {color_type}")
    channels = channels_by_color[color_type]
    rows = png_unfilter(zlib.decompress(bytes(idat)), width, height, channels, bit_depth)

    rgba = bytearray(width * height * 4)
    for i in range(width * height):
        src = i * channels
        dst = i * 4
        rgba[dst : dst + 3] = rows[src : src + 3]
        rgba[dst + 3] = rows[src + 3] if channels == 4 else 255
    return width, height, rgba


def write_png_rgba(width: int, height: int, rgba: bytes) -> bytes:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def restyle_tops_texture(width: int, height: int, rgba: bytearray) -> bytearray:
    teal = (35, 140, 152)
    deep = (23, 97, 107)
    panel = (230, 237, 240)
    dark = (23, 28, 32)
    yellow = (217, 177, 59)

    out = bytearray(rgba)
    for y in range(height):
        yy = y / max(height - 1, 1)
        for x in range(width):
            xx = x / max(width - 1, 1)
            i = (y * width + x) * 4
            r, g, b, a = out[i : i + 4]
            if a < 12:
                continue
            brightness = (r + g + b) / 765
            is_cloth = b > 60 or g > 45 or brightness > 0.25
            if not is_cloth:
                continue

            color = teal
            if 0.38 < xx < 0.62 and 0.12 < yy < 0.78:
                color = panel
            if 0.45 < xx < 0.55 and 0.13 < yy < 0.58:
                color = dark
            if abs(xx - 0.50) < 0.010 and 0.10 < yy < 0.78:
                color = deep
            if (0.18 < xx < 0.31 or 0.69 < xx < 0.82) and 0.25 < yy < 0.78:
                color = teal
            if 0.66 < xx < 0.77 and 0.27 < yy < 0.37:
                color = yellow

            shade = 0.72 + brightness * 0.45
            out[i] = min(255, int(color[0] * shade))
            out[i + 1] = min(255, int(color[1] * shade))
            out[i + 2] = min(255, int(color[2] * shade))
    return out


def rebuild_bin_with_replacements(gltf: dict, bin_chunk: bytes, replacements: dict[int, bytes]) -> bytes:
    buffer_views = gltf.get("bufferViews", [])
    new_bin = bytearray()
    for index, view in enumerate(buffer_views):
        alignment = (4 - len(new_bin) % 4) % 4
        new_bin.extend(b"\x00" * alignment)
        old_offset = view.get("byteOffset", 0)
        old_length = view["byteLength"]
        payload = replacements.get(index, bin_chunk[old_offset : old_offset + old_length])
        view["byteOffset"] = len(new_bin)
        view["byteLength"] = len(payload)
        new_bin.extend(payload)
    if gltf.get("buffers"):
        gltf["buffers"][0]["byteLength"] = len(new_bin)
    return bytes(new_bin)


def apply_texture_style(source: pathlib.Path, output: pathlib.Path, extract_dir: pathlib.Path | None = None) -> None:
    gltf, bin_chunk = read_glb(source)
    replacements: dict[int, bytes] = {}

    for material in gltf.get("materials", []):
        name = material.get("name", "")
        if "Tops" not in name:
            continue
        pbr = material.get("pbrMetallicRoughness", {})
        texture_index = pbr.get("baseColorTexture", {}).get("index")
        if texture_index is None:
            continue
        image_index = gltf["textures"][texture_index]["source"]
        image = gltf["images"][image_index]
        view_index = image["bufferView"]
        view = gltf["bufferViews"][view_index]
        start = view.get("byteOffset", 0)
        original = bin_chunk[start : start + view["byteLength"]]
        width, height, rgba = read_png_rgba(original)
        styled = restyle_tops_texture(width, height, rgba)
        replacement = write_png_rgba(width, height, styled)
        replacements[view_index] = replacement
        image["mimeType"] = "image/png"
        if extract_dir is not None:
            extract_dir.mkdir(parents=True, exist_ok=True)
            (extract_dir / "tops_texture_original.png").write_bytes(original)
            (extract_dir / "tops_texture_style_v2.png").write_bytes(replacement)
        pbr["baseColorFactor"] = [1, 1, 1, 1]

    if not replacements:
        raise ValueError("No tops texture was found")

    new_bin = rebuild_bin_with_replacements(gltf, bin_chunk, replacements)
    output.parent.mkdir(parents=True, exist_ok=True)
    write_glb(output, gltf, new_bin)
    print(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["list", "images", "style", "texture-style"])
    parser.add_argument("source", type=pathlib.Path)
    parser.add_argument("output", nargs="?", type=pathlib.Path)
    parser.add_argument("--extract-dir", type=pathlib.Path)
    args = parser.parse_args()

    if args.command == "list":
        list_materials(args.source)
        return

    if args.command == "images":
        list_images(args.source)
        return

    if args.output is None:
        raise SystemExit(f"{args.command} requires an output path")
    if args.command == "style":
        apply_field_style(args.source, args.output)
    else:
        apply_texture_style(args.source, args.output, args.extract_dir)


if __name__ == "__main__":
    main()
