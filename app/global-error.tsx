"use client";

/**
 * Reemplaza al root layout cuando éste falla: debe ser autocontenido
 * (html/body propios y estilos inline, porque el CSS global puede no cargar).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a0b2e",
          color: "#eddcff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.25rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontStyle: "italic" }}>
            Algo salió mal
          </h1>
          <p style={{ color: "#b9cacb", fontSize: "0.875rem" }}>
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
          {error.digest && (
            <p style={{ color: "#849495", fontSize: "0.75rem" }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1rem",
              height: "2.75rem",
              padding: "0 1.25rem",
              borderRadius: "0.25rem",
              border: "none",
              background: "#00f3ff",
              color: "#002022",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
