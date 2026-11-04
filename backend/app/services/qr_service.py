"""
QR Code Generation Service
Generates printable base64 SVG/PNG QR tokens for chemical bottles, storage cabinets, and equipment.
"""

import io
import base64
import qrcode

class QRService:

    @classmethod
    def generate_qr_base64(cls, token: str, label: str = None) -> str:
        """
        Generate a QR code as a base64 encoded PNG image for instant display and printing.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        # Embed structured JSON or token URI
        qr.add_data(token)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{b64_str}"
