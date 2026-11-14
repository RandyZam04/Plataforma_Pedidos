
# Bitácora · Arquitecturas y procesos · Nombre Apellido

## Entorno

| Dato | Valor |
| --- | --- |
| Laptop (CPU, RAM) | [Procesador y RAM] |
| nucleos según /metricas | [Número] |
| MAX_TRABAJADORES y MAX_COLA | 2 y 4 |
| Duración de un reporte con n=2000000 | [Número] ms |

## 1. Resultados

| Escenario | Latencia 50 % | Latencia máx. | Respuestas 2xx | Respuestas 503 | Timeouts | bucle.maxMs |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · bloqueo (/health) | | | | | | |
| 2 · worker sin límite | | | | | | |
| 3 · pool con límite | | | | | | |

### Escenario 1 · Bloqueo

**Salida de autocannon:**

```text
[PEGAR SALIDA COMPLETA DEL ESCENARIO 1]
```

**Respuesta de /metricas:**

```json
[PEGAR JSON DEL ESCENARIO 1]
```

### Escenario 2 · Worker sin límite

**Salida de autocannon:**

```text
[PEGAR SALIDA COMPLETA DEL ESCENARIO 2]
```

**Respuesta de /metricas:**

```json
[PEGAR JSON DEL ESCENARIO 2]
```

### Escenario 3 · Pool limitado

**Salida de autocannon:**

```text
[PEGAR SALIDA COMPLETA DEL ESCENARIO 3]
```

**Respuesta de /metricas:**

```json
[PEGAR JSON DEL ESCENARIO 3]
```

## 2. Análisis

### 1. Bloqueo del bucle de eventos

[Respuesta de 4 a 8 líneas]

### 2. Worker sin límite

[Respuesta de 4 a 8 líneas]

### 3. Pool y error 503

[Respuesta de 4 a 8 líneas]

### 4. Reintentos y Retry-After

[Respuesta de 4 a 8 líneas]

### 5. Tres réplicas de Pedidos

[Respuesta de 4 a 8 líneas]

## 3. Problemas encontrados

[Problemas reales y soluciones utilizadas]

## 4. Uso declarado de IA

[Herramientas de IA utilizadas y finalidad]
