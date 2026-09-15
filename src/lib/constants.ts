/** Cookie espejo del device id, leida por el servidor en el primer render. */
export const DEVICE_COOKIE = "tae_device_id";

export const DEVICE_STORAGE_KEY = "tae_device_id";

/**
 * Titulo de la obra. Se muestra en la pestaña, arriba de las tres variantes de
 * votacion y en la hoja de QR de las butacas: vive en un solo lugar para que no
 * quede una pantalla con el nombre viejo.
 */
export const SHOW_TITLE = "Agravado por el Vínculo";

/**
 * Donde vive la pantalla de votacion. Es lo que se codifica en el QR de las
 * butacas, asi que vale la misma regla que el titulo: un solo lugar, para que
 * no quede papel impreso apuntando a una ruta que se movio.
 *
 * Estuvo en la raiz hasta que la raiz paso a ser la landing de la obra.
 */
export const VOTE_PATH = "/votar";
