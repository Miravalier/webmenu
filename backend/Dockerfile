FROM python:3.12
ENV PYTHONUNBUFFERED=1

RUN pip install fastapi[all] pymongo requests

COPY ./src /app
WORKDIR /app
CMD ["python3", "main.py"]
