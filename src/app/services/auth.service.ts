import { Injectable, computed, signal } from '@angular/core';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { auth, db } from '../firebase';
import { Usuario } from '../models/usuario.model';

const COLECCION = 'usuarios';

/**
 * Autenticación con Firebase Auth; roles y datos de perfil viven en Firestore (usuarios/{uid}).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuarios = signal<Usuario[]>([]);
  private readonly _usuarioActual = signal<Usuario | null>(null);
  private readonly _listo = signal(false);

  readonly usuarioActual = this._usuarioActual.asReadonly();
  readonly listo = this._listo.asReadonly();
  readonly esAdmin = computed(() => this.usuarioActual()?.rol === 'admin');
  readonly esJuez = computed(() => this.usuarioActual()?.rol === 'juez');
  readonly jueces = computed(() => this._usuarios().filter((u) => u.rol === 'juez'));

  constructor() {
    onAuthStateChanged(auth, async (usuarioFirebase: User | null) => {
      this._usuarioActual.set(usuarioFirebase ? await this.leerPerfil(usuarioFirebase.uid) : null);
      this._listo.set(true);
    });
    onSnapshot(collection(db, COLECCION), (snap) => {
      this._usuarios.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Usuario));
    });
  }

  async iniciarSesion(email: string, password: string): Promise<boolean> {
    try {
      const credencial = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      this._usuarioActual.set(await this.leerPerfil(credencial.user.uid));
      return true;
    } catch {
      return false;
    }
  }

  cerrarSesion(): void {
    signOut(auth);
  }

  async agregarJuez(datos: { nombre: string; email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    if (!nombre || !email || datos.password.length < 6) {
      return { ok: false, error: 'Completa nombre, email y una contraseña de al menos 6 caracteres.' };
    }

    // App secundaria: crear un usuario con el SDK cliente inicia sesión con él,
    // así que se hace en una instancia aparte para no desconectar al admin actual.
    const appSecundaria = initializeApp(environment.firebase, `secundaria-${Date.now()}`);
    const authSecundaria = getAuth(appSecundaria);
    try {
      const credencial = await createUserWithEmailAndPassword(authSecundaria, email, datos.password);
      const nuevo: Omit<Usuario, 'id'> = { nombre, email, rol: 'juez', creadoEn: Date.now() };
      await setDoc(doc(db, COLECCION, credencial.user.uid), nuevo);
      return { ok: true };
    } catch (error) {
      const codigo = (error as { code?: string }).code;
      if (codigo === 'auth/email-already-in-use') {
        return { ok: false, error: 'Ya existe un usuario con ese email.' };
      }
      return { ok: false, error: 'No se pudo crear el juez.' };
    } finally {
      await signOut(authSecundaria);
      await deleteApp(appSecundaria);
    }
  }

  eliminarJuez(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  private async leerPerfil(uid: string): Promise<Usuario | null> {
    const snap = await getDoc(doc(db, COLECCION, uid));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Usuario) : null;
  }
}
