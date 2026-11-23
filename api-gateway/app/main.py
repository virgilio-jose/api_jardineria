from pathlib import Path
import os
import requests
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="API Gateway - Sistema Jardinería")

raw_origins = os.getenv("CORS_ORIGINS", "*")
allow_origins = (
    ["*"]
    if raw_origins.strip() == "*"
    else [o.strip() for o in raw_origins.split(",") if o.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

SERVICES = {
    "clientes": os.getenv("CLIENTES_SERVICE_URL", "http://service-clientes:8000"),
    "empleados": os.getenv("EMPLEADOS_SERVICE_URL", "http://service-empleados:8000"),
    "servicios": os.getenv("SERVICIOS_SERVICE_URL", "http://service-servicios:8000"),
    "ordenes": os.getenv("ORDENES_SERVICE_URL", "http://service-ordenes:8000"),
}

FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")


@app.get("/")
def serve_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/health")
def health_check():
    return {"status": "ok", "gateway": "running"}


@app.api_route(
    "/api/{service}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE"],
)
async def proxy(service: str, path: str, request: Request):
    base_url = SERVICES.get(service)
    if not base_url:
        raise HTTPException(status_code=404, detail="Servicio no encontrado en el gateway")

    url = f"{base_url}/{path.lstrip('/')}"
    body = await request.body()
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length"}
    }

    try:
        resp = requests.request(
            method=request.method,
            url=url,
            params=request.query_params,
            data=body if body else None,
            headers=headers,
            timeout=5,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502, detail=f"Error conectando con {service}: {exc}"
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type"),
    )