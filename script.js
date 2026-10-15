
"use strict";

// Elementos del HTML
const formulario = document.getElementById("formulario-usuario");
const campoId = document.getElementById("id");
const campoNombre = document.getElementById("nombre");
const campoCorreo = document.getElementById("correo");
const campoCiudad = document.getElementById("ciudad");
const buscador = document.getElementById("buscador");
const tablaUsuarios = document.getElementById("tabla-usuarios");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");

// Arreglo principal de usuarios
let usuarios = [];
let editandoId = null;

// Escapa caracteres especiales para evitar insertar HTML no deseado
const escaparHTML = (texto) => String(texto ?? "").replace(
    /[&<>"']/g,
    (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]
);

// Carga los usuarios desde la API
const cargarUsuarios = async () => {
    mensaje.textContent = "Cargando usuarios...";

    try {
        const respuesta = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!respuesta.ok) {
            throw new Error("No fue posible consultar los usuarios.");
        }

        const datos = await respuesta.json();

        // Transformamos los datos con map y destructuring
        usuarios = datos.map(({ id, name, email, address }) => ({
            id,
            nombre: name,
            correo: email,
            ciudad: address.city
        }));

        console.log("Lista completa de usuarios:", usuarios);
        console.log(JSON.stringify(usuarios, null, 2));

        actualizarTabla();

        mensaje.textContent =
            `Se cargaron ${usuarios.length} usuarios correctamente.`;

    } catch (error) {
        console.error("Error al cargar usuarios:", error);

        mensaje.textContent =
            "No se pudieron cargar los usuarios. Verifica tu conexión a internet.";
    }
};

// Agrega una ciudad al selector si todavía no existe
const asegurarCiudad = (ciudad) => {
    const existe = Array.from(campoCiudad.options).some(
        (opcion) => opcion.value === ciudad
    );

    if (!existe && ciudad !== "") {
        const opcion = document.createElement("option");
        opcion.value = ciudad;
        opcion.textContent = ciudad;
        campoCiudad.appendChild(opcion);
    }
};

// Dibuja las filas de la tabla
const dibujarTabla = (lista) => {
    tablaUsuarios.innerHTML = "";

    if (lista.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="5">No se encontraron usuarios.</td>
            </tr>
        `;
        return;
    }

    lista.forEach(({ id, nombre, correo, ciudad }) => {
        tablaUsuarios.innerHTML += `
            <tr>
                <td>${escaparHTML(id)}</td>
                <td>${escaparHTML(nombre)}</td>
                <td>${escaparHTML(correo)}</td>
                <td>${escaparHTML(ciudad)}</td>
                <td>
                    <button
                        type="button"
                        class="btn-editar"
                        data-accion="editar"
                        data-id="${escaparHTML(id)}">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="btn-eliminar"
                        data-accion="eliminar"
                        data-id="${escaparHTML(id)}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
};

// Actualiza la tabla y aplica la búsqueda
const actualizarTabla = () => {
    const busqueda = buscador.value.trim().toLowerCase();

    const resultado = usuarios.filter(({ nombre }) =>
        nombre.toLowerCase().includes(busqueda)
    );

    dibujarTabla(resultado);

    // Recorremos el arreglo con un bucle for
    let total = 0;

    for (const usuario of usuarios) {
        if (usuario.nombre) {
            total++;
        }
    }

    console.log(`Total de usuarios registrados: ${total}`);
};

// Limpia el formulario y sale del modo edición
const limpiarFormulario = () => {
    formulario.reset();
    editandoId = null;

    campoId.disabled = false;
    btnGuardar.textContent = "Agregar usuario";
    btnCancelar.hidden = true;
};

// Cancela la edición
btnCancelar.addEventListener("click", () => {
    limpiarFormulario();
    mensaje.textContent = "Edición cancelada.";
});

// Buscador en vivo
buscador.addEventListener("input", () => {
    actualizarTabla();
});

// Agrega o modifica usuarios
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const idTexto = campoId.value.trim();
    const nombre = campoNombre.value.trim();
    const correo = campoCorreo.value.trim();
    const ciudad = campoCiudad.value.trim();

    // Validamos que ningún campo esté vacío
    const campos = [idTexto, nombre, correo, ciudad];

    for (const campo of campos) {
        if (campo === "") {
            mensaje.textContent =
                "Todos los campos son obligatorios.";
            return;
        }
    }

    // Validamos que el ID sea un entero positivo
    const id = Number(idTexto);

    if (!Number.isInteger(id) || id <= 0) {
        mensaje.textContent =
            "El ID debe ser un número entero positivo.";
        return;
    }

    // Validamos el correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mensaje.textContent =
            "Ingresa un correo electrónico válido.";
        return;
    }

    // Modificar un usuario existente
    if (editandoId !== null) {
        const indice = usuarios.findIndex(
            (usuario) => usuario.id === editandoId
        );

        if (indice === -1) {
            mensaje.textContent =
                "No se encontró el usuario que deseas modificar.";

            limpiarFormulario();
            return;
        }

        usuarios[indice] = {
            ...usuarios[indice],
            nombre,
            correo,
            ciudad
        };

        console.log("Lista actualizada:", usuarios);

        limpiarFormulario();
        actualizarTabla();

        mensaje.textContent =
            `El usuario ${nombre} fue modificado correctamente.`;

    } else {
        // Comprobamos que el ID no esté repetido
        const existe = usuarios.some(
            (usuario) => usuario.id === id
        );

        if (existe) {
            mensaje.textContent =
                `Ya existe un usuario con el ID ${id}.`;
            return;
        }

        // Agregamos el usuario al arreglo
        usuarios.push({
            id,
            nombre,
            correo,
            ciudad
        });

        console.log("Lista actualizada:", usuarios);

        limpiarFormulario();
        actualizarTabla();

        mensaje.textContent =
            `El usuario ${nombre} fue agregado correctamente.`;
    }
});

// Delegación de eventos para editar y eliminar
tablaUsuarios.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton || !tablaUsuarios.contains(boton)) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    const usuario = usuarios.find(
        (elemento) => elemento.id === id
    );

    if (!usuario) {
        mensaje.textContent = "No se encontró el usuario.";
        return;
    }

    switch (accion) {
        case "editar":
            campoId.value = usuario.id;
            campoNombre.value = usuario.nombre;
            campoCorreo.value = usuario.correo;

            // Garantizamos que la ciudad del usuario esté disponible
            asegurarCiudad(usuario.ciudad);
            campoCiudad.value = usuario.ciudad;

            // Bloqueamos el ID durante la edición
            campoId.disabled = true;
            editandoId = usuario.id;

            btnGuardar.textContent = "Guardar cambios";
            btnCancelar.hidden = false;

            mensaje.textContent =
                `Editando al usuario ${usuario.nombre}.`;

            formulario.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            break;

        case "eliminar":
            if (confirm(
                `¿Estás seguro de eliminar a ${usuario.nombre}?`
            )) {
                usuarios = usuarios.filter(
                    (elemento) => elemento.id !== id
                );

                if (editandoId === id) {
                    limpiarFormulario();
                }

                console.log("Lista actualizada:", usuarios);
                actualizarTabla();

                mensaje.textContent =
                    `El usuario ${usuario.nombre} fue eliminado.`;
            }
            break;

        default:
            mensaje.textContent = "Acción no reconocida.";
    }
});

// Inicia la aplicación
cargarUsuarios();
