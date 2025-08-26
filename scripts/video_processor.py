import subprocess
import os

def convert_video_to_audio(video_path, audio_path):
    try:
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'libmp3lame',
            '-ab', '192k',
            '-ar', '44100',
            audio_path
        ]
        subprocess.run(command, check=True)
        return True
    except Exception as e:
        print(f"Error converting video: {str(e)}")
        return False 