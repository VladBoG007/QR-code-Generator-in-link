import os
import datetime
import base64
from io import BytesIO
import qrcode
import eel

eel.init("web")

QR_DIR = "QR-codes"


def ensure_qr_dir():
    if not os.path.exists(QR_DIR):
        os.makedirs(QR_DIR)


def generate_filename():
    now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d_%H-%M-%S_QR.png")


@eel.expose
def generate_qr(url: str):
    """
    Генерация QR-кода, сохранение файла и возврат данных для фронта.
    """
    ensure_qr_dir()
    if not url:
        return {"success": False, "error": "Пустая ссылка"}

    img = qrcode.make(url)

    filename = generate_filename()
    file_path = os.path.join(QR_DIR, filename)
    img.save(file_path)

    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return {
        "success": True,
        "file_name": filename,
        "created_at": filename.split("_QR.png")[0].replace("_", " "),
        "img_b64": img_b64,
        "file_path": file_path.replace("\\", "/"),
    }


@eel.expose
def list_qr_codes():
    ensure_qr_dir()
    files = []

    for fname in os.listdir(QR_DIR):
        if not fname.lower().endswith(".png"):
            continue
        full_path = os.path.join(QR_DIR, fname)

        name_no_ext = fname.replace("_QR.png", "")
        try:
            dt = datetime.datetime.strptime(name_no_ext, "%Y-%m-%d_%H-%M-%S")
        except ValueError:
            dt = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))

        with open(full_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        files.append(
            {
                "file_name": fname,
                "created_at": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": dt.timestamp(),
                "img_b64": img_b64,
                "file_path": full_path.replace("\\", "/"),
            }
        )

    files.sort(key=lambda x: x["timestamp"], reverse=True)

    return files


def start():
    ensure_qr_dir()
    eel.start(
        "index.html",
        size=(1100, 700),
        mode="chrome",
    )


if __name__ == "__main__":
    start()
