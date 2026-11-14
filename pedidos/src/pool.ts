
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";

interface Trabajo {
  n: number;
  resolve: (resultado: number) => void;
  reject: (error: Error) => void;
}

function leerLimite(
  valor: string | undefined,
  defecto: number,
  minimo: number
): number {
  const numero = Number(valor);

  if (
    valor !== undefined &&
    Number.isSafeInteger(numero) &&
    numero >= minimo
  ) {
    return numero;
  }

  return defecto;
}

const maxTrabajadores = leerLimite(
  process.env.MAX_TRABAJADORES,
  os.availableParallelism(),
  1
);

const maxCola = leerLimite(
  process.env.MAX_COLA,
  maxTrabajadores * 2,
  0
);

const cola: Trabajo[] = [];

let activos = 0;
let rechazadas = 0;

export class PoolLleno extends Error {
  constructor() {
    super("El pool de trabajadores esta lleno");
    this.name = "PoolLleno";
  }
}

function iniciarTrabajo(trabajo: Trabajo): void {
  activos++;

  try {
    const archivo = path.join(
      __dirname,
      "worker-reporter.js"
    );

    const worker = new Worker(archivo, {
      workerData: { n: trabajo.n }
    });

    let resultado: number | undefined;
    let fallo: Error | undefined;

    worker.once("message", (primos: number) => {
      resultado = primos;
    });

    worker.once("error", (error: Error) => {
      fallo = error;
    });

    worker.once("exit", (codigo: number) => {
      activos--;

      if (fallo) {
        trabajo.reject(fallo);
      } else if (codigo !== 0 || resultado === undefined) {
        trabajo.reject(
          new Error(`Worker finalizo con codigo ${codigo}`)
        );
      } else {
        trabajo.resolve(resultado);
      }

      despachar();
    });

  } catch (error) {
    activos--;

    trabajo.reject(
      error instanceof Error
        ? error
        : new Error(String(error))
    );

    despachar();
  }
}

function despachar(): void {
  while (
    activos < maxTrabajadores &&
    cola.length > 0
  ) {
    const siguiente = cola.shift();

    if (siguiente) {
      iniciarTrabajo(siguiente);
    }
  }
}

export function contarPrimosEnPool(
  n: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    const trabajo: Trabajo = {
      n,
      resolve,
      reject
    };

    if (
      activos < maxTrabajadores &&
      cola.length === 0
    ) {
      iniciarTrabajo(trabajo);
      return;
    }

    if (cola.length >= maxCola) {
      rechazadas++;
      reject(new PoolLleno());
      return;
    }

    cola.push(trabajo);
    despachar();
  });
}

export function estadoPool() {
  return {
    maxTrabajadores,
    activos,
    enCola: cola.length,
    maxCola,
    rechazadas
  };
}
