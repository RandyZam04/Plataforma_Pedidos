import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const GRPC_PORT = Number(process.env.GRPC_PORT ?? 50051);
const definicion = protoLoader.loadSync(path.join(__dirname, "../proto/inventario.proto"), {
    keepCase: true,
    defaults: true
});
const paquete = grpc.loadPackageDefinition(definicion) as any;

interface SolicitudStock { sku: string; }
interface Stock { sku: string; stock: number; }
interface SolicitudReserva { sku: string; cantidad: number; }
interface Reserva { sku: string; reservado: number; restante: number; }

const esperar = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function iniciarGrpc(stock: Map<string, number>, retardoMs: number) {
    async function consultarStock(
        call: grpc.ServerUnaryCall<SolicitudStock, Stock>,
        callback: grpc.sendUnaryData<Stock>
    ) {
        if (retardoMs > 0) await esperar(retardoMs);
        const sku = call.request.sku;
        const disponible = stock.get(sku);
        if (disponible === undefined) {
            callback({ code: grpc.status.NOT_FOUND, details: `El producto con SKU ${sku} no existe` });
            return;
        }
        callback(null, { sku, stock: disponible });
    }

    async function reservar(
        call: grpc.ServerUnaryCall<SolicitudReserva, Reserva>,
        callback: grpc.sendUnaryData<Reserva>
    ) {
        if (retardoMs > 0) await esperar(retardoMs);
        const { sku, cantidad } = call.request;
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            callback({ code: grpc.status.INVALID_ARGUMENT, details: "cantidad debe ser un entero mayor que 0" });
            return;
        }
        const disponible = stock.get(sku);
        if (disponible === undefined) {
            callback({ code: grpc.status.NOT_FOUND, details: `El producto con SKU ${sku} no existe` });
            return;
        }
        if (cantidad > disponible) {
            callback({ code: grpc.status.FAILED_PRECONDITION, details: `Stock insuficiente: solicitado ${cantidad}, disponible ${disponible}` });
            return;
        }
        // Sin await entre lectura y escritura: operación atómica en este proceso.
        // Un deadline del cliente no revierte el descuento en el servidor.
        const restante = disponible - cantidad;
        stock.set(sku, restante);
        callback(null, { sku, reservado: cantidad, restante });
    }

    const servidor = new grpc.Server();
    servidor.addService(paquete.inventario.Inventario.service, {
        ConsultarStock: consultarStock,
        Reservar: reservar
    });
    servidor.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err) => {
        if (err) throw err;
        console.log(`Servidor gRPC escuchando en el puerto ${GRPC_PORT}`);
    });
}
