import { redirect } from 'next/navigation';

/** La entrada al panel vive en /entrar (es la misma para todas las empresas). */
export default function OldLoginRedirect() {
  redirect('/entrar');
}
