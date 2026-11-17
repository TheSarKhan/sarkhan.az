"""Render the portfolio's silent background motion loop."""
from pathlib import Path
from subprocess import Popen
from math import tau

import numpy as np
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / 'frontend/public/assets'
FPS = 24
FRAMES = FPS * 8


def encode(name, size, draw):
    width, height = size
    output = ASSETS / f'{name}.mp4'
    command = [
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
        '-pix_fmt', 'rgb24', '-s', f'{width}x{height}', '-r', str(FPS),
        '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf',
        '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output),
    ]
    with Popen(command, stdin=-1) as process:
        for frame in range(FRAMES):
            image = draw(tau * frame / FRAMES)
            if frame == 0:
                image.save(ASSETS / f'{name}.webp', quality=84)
            process.stdin.write(image.tobytes())
        process.stdin.close()
        if process.wait():
            raise RuntimeError(f'Could not encode {output}')


background_size = (1152, 648)
y, x = np.mgrid[-1:1:648j, -1:1:1152j].astype(np.float32)
palette = np.array([
    [10, 45, 35], [31, 105, 76], [82, 151, 113], [211, 195, 132],
    [160, 91, 69], [74, 57, 107], [23, 58, 79], [51, 118, 117],
], dtype=np.float32)
grain = np.random.default_rng(9).normal(0, 1.3, x.shape).astype(np.float32)


def background(t):
    bend = y * 0.92 + 0.39 * np.sin(x * 2.3 + t) + 0.28 * x
    fold = bend + 0.25 * np.sin(y * 2.7 - x * 1.4 - t)
    stripes = fold * 3.6 + 0.55 * np.sin(x * 2.4 + t)
    band = np.floor(stripes).astype(int) % len(palette)
    section = stripes % 1
    sheen = 0.67 + 0.42 * np.sin(section * np.pi) + 0.20 * np.exp(-((section - 0.11) * 8) ** 2)
    vignette = 1.08 - np.minimum(0.44, (x ** 2 + y ** 2) * 0.2)
    colors = palette[band] * (sheen * vignette)[..., None] + grain[..., None]
    return Image.fromarray(np.clip(colors, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    encode('motion-background', background_size, background)
