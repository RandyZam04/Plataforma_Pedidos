

import { Request, Response, NextFunction } from "express";
import { monitorEventLoopDelay } from "node:perf_hooks";
import os from "node:os";

const UMBRAL_LENTA_MS = Number(
  process.env.UMBRAL_LENTA_MS ?? 1000
);

const retardoBucle = monitorEventLoopDelay({
  resolution: 10
});

retardoBucle.enable();

interface Estadistica {
  peticiones: number;
  totalMs: number;
  maxMs: number;
  lentas: number;
}

const porRuta = new Map<string, Estadistica>();

export function medirLatencia(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const inicio = performance.now();

  res.on("finish", () => {
    const duracionMs = performance.now() - inicio;
    const ruta = `${req.method} ${req.path}`;

    let estadistica = porRuta.get(ruta);

    if (!estadistica) {
      estadistica = {
        peticiones: 0,
        totalMs: 0,
        maxMs: 0,
        lentas: 0
      };

      porRuta.set(ruta, estadistica);
    }

    estadistica.peticiones++;
    estadistica.totalMs += duracionMs;
    estadistica.maxMs = Math.max(
      estadistica.maxMs,
      duracionMs
    );

    if (duracionMs > UMBRAL_LENTA_MS) {
      estadistica.lentas++;
    }
  });

  next();
}

export function resumenMetricas() {
  return {
    umbralLentaMs: UMBRAL_LENTA_MS,

    rutas: Array.from(porRuta.entries()).map(
      ([ruta, estadistica]) => ({
        ruta,
        peticiones: estadistica.peticiones,
        promedioMs:
          estadistica.totalMs / estadistica.peticiones,
        maxMs: estadistica.maxMs,
        lentas: estadistica.lentas
      })
    ),

    nucleos: os.availableParallelism(),

    bucle: {
      p50Ms: Math.round(
        retardoBucle.percentile(50) / 1e6
      ),
      p99Ms: Math.round(
        retardoBucle.percentile(99) / 1e6
      ),
      maxMs: Math.round(
        retardoBucle.max / 1e6
      )
    }
  };
}
