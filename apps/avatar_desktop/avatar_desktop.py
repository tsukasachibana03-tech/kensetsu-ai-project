from __future__ import annotations

import base64
import subprocess
import threading
import tkinter as tk
from ctypes import Structure, byref, windll
from ctypes.wintypes import LONG
from pathlib import Path

from PIL import Image, ImageTk


APP_DIR = Path(__file__).resolve().parent
AVATAR_PATH = APP_DIR / "assets" / "field_support_avatar.png"
EXPRESSION_DIR = APP_DIR / "assets" / "expressions"
WINDOW_KEY_COLOR = "magenta"

EXPRESSIONS = {
    "normal": ("\u901a\u5e38", EXPRESSION_DIR / "normal.png"),
    "smile": ("\u7b11\u9854", EXPRESSION_DIR / "smile.png"),
    "closed_smile": ("\u306b\u3063\u3053\u308a", EXPRESSION_DIR / "closed_smile.png"),
    "surprised": ("\u3073\u3063\u304f\u308a", EXPRESSION_DIR / "surprised.png"),
    "soft": ("\u3084\u3055\u3057\u3044", EXPRESSION_DIR / "soft.png"),
    "laugh": ("\u5927\u7b11\u3044", EXPRESSION_DIR / "laugh.png"),
}

VOICE_LINES = {
    "greeting": (
        "\u3042\u3044\u3055\u3064",
        "\u30c1\u30d0\u30c6\u30f3\u3055\u3093\u3001\u304a\u306f\u3088\u3046\u3054\u3056\u3044\u307e\u3059\u3002\u4eca\u65e5\u3082\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u3002",
        "smile",
    ),
    "start_work": (
        "\u4f5c\u696d\u958b\u59cb",
        "\u305d\u308c\u3067\u306f\u3001\u4e00\u3064\u305a\u3064\u9032\u3081\u3066\u3044\u304d\u307e\u3057\u3087\u3046\u3002\u8cc7\u6599\u306e\u78ba\u8a8d\u304b\u3089\u59cb\u3081\u307e\u3059\u306d\u3002",
        "soft",
    ),
    "confirmed": (
        "\u78ba\u8a8d\u3057\u307e\u3057\u305f",
        "\u78ba\u8a8d\u3057\u307e\u3057\u305f\u3002\u5927\u4e08\u592b\u3067\u3059\u3002\u3053\u306e\u8abf\u5b50\u3067\u9032\u3081\u307e\u3057\u3087\u3046\u3002",
        "smile",
    ),
    "break": (
        "\u4f11\u61a9",
        "\u5c11\u3057\u4f11\u61a9\u3057\u307e\u3057\u3087\u3046\u3002\u7126\u3089\u306a\u304f\u3066\u5927\u4e08\u592b\u3067\u3059\u3088\u3002",
        "closed_smile",
    ),
    "test": (
        "\u97f3\u58f0\u30c6\u30b9\u30c8",
        "\u97f3\u58f0\u30c6\u30b9\u30c8\u3067\u3059\u3002\u79c1\u306e\u58f0\u3001\u805e\u3053\u3048\u3066\u3044\u307e\u3059\u304b\u3002",
        "smile",
    ),
}


class Rect(Structure):
    _fields_ = [
        ("left", LONG),
        ("top", LONG),
        ("right", LONG),
        ("bottom", LONG),
    ]


def make_process_dpi_aware() -> None:
    try:
        windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        try:
            windll.user32.SetProcessDPIAware()
        except Exception:
            pass


def get_work_area() -> Rect:
    rect = Rect()
    ok = windll.user32.SystemParametersInfoW(0x0030, 0, byref(rect), 0)
    if ok:
        return rect

    rect.left = 0
    rect.top = 0
    rect.right = windll.user32.GetSystemMetrics(0)
    rect.bottom = windll.user32.GetSystemMetrics(1)
    return rect


def speak_windows(text: str, rate: int = -1, volume: int = 95) -> None:
    encoded_text = base64.b64encode(text.encode("utf-8")).decode("ascii")
    script = f"""
Add-Type -AssemblyName System.Speech
$text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("{encoded_text}"))
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object {{ $_.VoiceInfo.Culture.Name -eq "ja-JP" }} | Select-Object -First 1
if ($voice -ne $null) {{ $synth.SelectVoice($voice.VoiceInfo.Name) }}
$synth.Rate = {rate}
$synth.Volume = {volume}
$synth.Speak($text)
$synth.Dispose()
"""
    encoded_command = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    startupinfo = None
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    except Exception:
        startupinfo = None

    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded_command],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        startupinfo=startupinfo,
        creationflags=creationflags,
        check=False,
    )


class DesktopAvatar:
    def __init__(self) -> None:
        make_process_dpi_aware()
        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.configure(bg=WINDOW_KEY_COLOR)
        self.root.wm_attributes("-topmost", True)
        self.root.wm_attributes("-transparentcolor", WINDOW_KEY_COLOR)

        self.scale = 0.55
        self.drag_x = 0
        self.drag_y = 0
        self.frame = 0
        self.current_expression = "normal"
        self.motion_mode = "natural"
        self.speaking = False

        self.expression_images = self.load_expression_images()
        self.original = self.expression_images.get("normal", Image.open(AVATAR_PATH).convert("RGBA"))
        self.label = tk.Label(self.root, bg=WINDOW_KEY_COLOR, borderwidth=0, highlightthickness=0)
        self.label.pack()

        self.build_menu()

        self.label.bind("<ButtonPress-1>", self.start_drag)
        self.label.bind("<B1-Motion>", self.drag)
        self.label.bind("<Button-3>", self.show_menu)
        self.label.bind("<Double-Button-1>", lambda _event: self.root.destroy())
        self.root.bind("<Escape>", lambda _event: self.root.destroy())
        self.root.bind("1", lambda _event: self.set_expression("normal"))
        self.root.bind("2", lambda _event: self.set_expression("smile"))
        self.root.bind("3", lambda _event: self.set_expression("closed_smile"))
        self.root.bind("4", lambda _event: self.set_expression("surprised"))
        self.root.bind("5", lambda _event: self.set_expression("soft"))
        self.root.bind("6", lambda _event: self.set_expression("laugh"))
        self.root.bind("v", lambda _event: self.say_line("test"))
        self.root.bind("m", lambda _event: self.toggle_motion())

        self.update_image()
        self.root.update_idletasks()
        self.apply_window_attributes()
        self.place_bottom_right()
        self.root.after(250, self.place_bottom_right)
        self.root.after(900, self.place_bottom_right)

    def build_menu(self) -> None:
        self.menu = tk.Menu(self.root, tearoff=False)

        self.expression_menu = tk.Menu(self.menu, tearoff=False)
        for key, (label, _path) in EXPRESSIONS.items():
            self.expression_menu.add_command(label=label, command=lambda expression=key: self.set_expression(expression))
        self.menu.add_cascade(label="\u8868\u60c5", menu=self.expression_menu)

        self.voice_menu = tk.Menu(self.menu, tearoff=False)
        for key, (label, _text, _expression) in VOICE_LINES.items():
            self.voice_menu.add_command(label=label, command=lambda line_key=key: self.say_line(line_key))
        self.voice_menu.add_separator()
        self.voice_menu.add_command(label="\u5165\u529b\u3057\u3066\u8a71\u3059", command=self.open_speech_window)
        self.menu.add_cascade(label="\u97f3\u58f0", menu=self.voice_menu)

        self.motion_menu = tk.Menu(self.menu, tearoff=False)
        self.motion_menu.add_command(label="\u81ea\u7136", command=lambda: self.set_motion_mode("natural"))
        self.motion_menu.add_command(label="\u63a7\u3048\u3081", command=lambda: self.set_motion_mode("gentle"))
        self.motion_menu.add_command(label="\u505c\u6b62", command=lambda: self.set_motion_mode("still"))
        self.menu.add_cascade(label="\u52d5\u304d", menu=self.motion_menu)

        self.menu.add_separator()
        self.menu.add_command(label="\u5927\u304d\u304f\u3059\u308b", command=lambda: self.change_scale(1.1))
        self.menu.add_command(label="\u5c0f\u3055\u304f\u3059\u308b", command=lambda: self.change_scale(0.9))
        self.menu.add_separator()
        self.menu.add_command(label="\u7d42\u4e86", command=self.root.destroy)

    def apply_window_attributes(self) -> None:
        self.root.configure(bg=WINDOW_KEY_COLOR)
        self.label.configure(bg=WINDOW_KEY_COLOR)
        self.root.wm_attributes("-topmost", True)
        self.root.wm_attributes("-transparentcolor", WINDOW_KEY_COLOR)
        self.root.lift()

    def change_scale(self, multiplier: float) -> None:
        self.scale = max(0.25, min(1.2, self.scale * multiplier))
        self.update_image()

    def start_drag(self, event: tk.Event) -> None:
        self.drag_x = event.x
        self.drag_y = event.y

    def drag(self, event: tk.Event) -> None:
        x = self.root.winfo_x() + event.x - self.drag_x
        y = self.root.winfo_y() + event.y - self.drag_y
        self.root.geometry(f"+{x}+{y}")

    def show_menu(self, event: tk.Event) -> None:
        self.menu.tk_popup(event.x_root, event.y_root)

    def place_bottom_right(self) -> None:
        self.root.update_idletasks()
        work_area = get_work_area()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = max(work_area.left, work_area.right - width - 24)
        y = max(work_area.top, work_area.bottom - height - 24)
        self.root.geometry(f"+{x}+{y}")

    def update_image(self) -> None:
        source = self.get_display_image()
        target_height = int(620 * self.scale)
        ratio = target_height / source.height
        target_width = max(1, int(source.width * ratio))
        image = source.resize((target_width, target_height), Image.Resampling.LANCZOS)
        image = self.harden_alpha(image)

        self.photo = ImageTk.PhotoImage(image)
        self.label.configure(image=self.photo)

    @staticmethod
    def harden_alpha(image: Image.Image) -> Image.Image:
        image = image.convert("RGBA")
        pixels = image.load()
        width, height = image.size

        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a < 150:
                    pixels[x, y] = (255, 255, 255, 0)
                else:
                    pixels[x, y] = (r, g, b, 255)

        return image

    def animate(self) -> None:
        self.root.after(250, self.animate)

    def run(self) -> None:
        self.root.mainloop()

    def load_expression_images(self) -> dict[str, Image.Image]:
        images = {}
        for key, (_label, path) in EXPRESSIONS.items():
            if path.exists():
                images[key] = Image.open(path).convert("RGBA")
        return images

    def set_expression(self, expression: str) -> None:
        image = self.expression_images.get(expression)
        if image is None:
            return

        self.current_expression = expression
        self.original = image
        self.update_image()

    def get_display_image(self) -> Image.Image:
        return self.expression_images.get(self.current_expression, self.original)

    def set_motion_mode(self, mode: str) -> None:
        self.motion_mode = mode
        self.update_image()

    def toggle_motion(self) -> None:
        self.set_motion_mode("still" if self.motion_mode != "still" else "natural")

    def say_line(self, line_key: str) -> None:
        line = VOICE_LINES.get(line_key)
        if line is None:
            return

        _label, text, expression = line
        self.say(text, expression)

    def say(self, text: str, expression: str = "smile") -> None:
        if expression:
            self.set_expression(expression)

        self.speaking = True

        def speak_and_reset() -> None:
            speak_windows(text)
            self.root.after(0, self.finish_speaking)

        thread = threading.Thread(target=speak_and_reset, daemon=True)
        thread.start()

    def finish_speaking(self) -> None:
        self.speaking = False

    def open_speech_window(self) -> None:
        window = tk.Toplevel(self.root)
        window.title("\u8a71\u3059")
        window.attributes("-topmost", True)
        window.resizable(False, False)

        entry = tk.Entry(window, width=36)
        entry.insert(0, "\u4eca\u65e5\u3082\u4e00\u7dd2\u306b\u9811\u5f35\u308a\u307e\u3057\u3087\u3046\u3002")
        entry.grid(row=0, column=0, padx=10, pady=10)

        def speak_entered_text() -> None:
            text = entry.get().strip()
            if text:
                self.say(text, "smile")

        button = tk.Button(window, text="\u8a71\u3059", command=speak_entered_text)
        button.grid(row=0, column=1, padx=(0, 10), pady=10)
        entry.bind("<Return>", lambda _event: speak_entered_text())
        entry.focus_set()


if __name__ == "__main__":
    DesktopAvatar().run()
