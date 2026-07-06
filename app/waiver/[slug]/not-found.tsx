export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-zinc-900">
          Este enlace no está disponible
        </h1>
        <p className="mt-2 text-zinc-600">
          El evento no existe o ya no está aceptando firmas. Si crees que esto
          es un error, contacta a quien te compartió este enlace.
        </p>
      </div>
    </main>
  );
}
