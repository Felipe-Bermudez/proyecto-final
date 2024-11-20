const readline = require('readline');
const bcrypt = require('bcrypt');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const saltRounds = 10; 

// Cada usuario tendrá una estructura { password: '', scores: [], lists: [] }
let users = {}; 

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function register() {
  console.log('--- Registro ---');
  const username = await prompt('Ingrese un nombre de usuario: ');
  if (users[username]) {
    console.log('El nombre de usuario ya está registrado.');
    return;
  }
  const password = await prompt('Ingrese una contraseña: ');
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const scores = [];
  const lists = []; // Inicializamos listas para cada usuario
  let addScoreSets = true;
  while (addScoreSets) {
    const scoreSet = [];
    console.log('--- Ingrese un conjunto de puntajes ---');
    let addScores = true;
    while (addScores) {
      const score = await prompt('Ingrese un puntaje (o presione Enter para finalizar el conjunto): ');
      if (score === '') {
        addScores = false;
      } else {
        scoreSet.push(parseFloat(score));
      }
    }
    if (scoreSet.length > 0) {
      scores.push(scoreSet);
    }
    
    const moreSets = await prompt('¿Desea ingresar otro conjunto de puntajes? (sí/no): ');
    if (moreSets.toLowerCase() !== 'sí') {
      addScoreSets = false;
    }
  }

  users[username] = { password: hashedPassword, scores: scores, lists: lists };
  console.log('Registro exitoso.');
}

async function login() {
  console.log('--- Login ---');
  const username = await prompt('Ingrese su nombre de usuario: ');
  const password = await prompt('Ingrese su contraseña: ');
  const user = users[username];
  if (user && await bcrypt.compare(password, user.password)) {
    console.log('Login exitoso.');
  } else {
    console.log('Nombre de usuario o contraseña incorrectos.');
  }
}

async function edit() {
  console.log('--- Edición de usuario ---');
  const username = await prompt('Ingrese el nombre de usuario para editar: ');
  if (!users[username]) {
    console.log('El usuario no existe.');
    return;
  }
  const newPassword = await prompt('Ingrese la nueva contraseña: ');
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  const newScores = [];
  let addScoreSets = true;
  while (addScoreSets) {
    const scoreSet = [];
    console.log('--- Ingrese un nuevo conjunto de puntajes ---');
    let addScores = true;
    while (addScores) {
      const score = await prompt('Ingrese un nuevo puntaje (o presione Enter para finalizar el conjunto): ');
      if (score === '') {
        addScores = false;
      } else {
        scoreSet.push(parseFloat(score));
      }
    }
    if (scoreSet.length > 0) {
      newScores.push(scoreSet);
    }
    
    const moreSets = await prompt('¿Desea ingresar otro conjunto de puntajes? (sí/no): ');
    if (moreSets.toLowerCase() !== 'sí') {
      addScoreSets = false;
    }
  }

  users[username].password = hashedPassword;
  users[username].scores = newScores;
  console.log('Contraseña y puntajes actualizados.');
}

async function deleteUser() {
  console.log('--- Eliminación de usuario ---');
  const username = await prompt('Ingrese el nombre de usuario para eliminar: ');
  if (users[username]) {
    delete users[username];
    console.log('Usuario eliminado.');
  } else {
    console.log('El usuario no existe.');
  }
}

// Agregar lista personalizada 
async function addList() {
  console.log('--- Agregar lista personalizada ---');
  const username = await prompt('Ingrese el nombre de usuario: ');
  if (!users[username]) {
    console.log('El usuario no existe.');
    return;
  }
  const listName = await prompt('Ingrese el nombre de la lista: ');
  if (users[username].lists.some(list => list.name === listName)) {
    console.log('La lista ya existe.');
    return;
  }
  const items = [];
  let addItem = true;
  while (addItem) {
    const item = await prompt('Ingrese un elemento (o presione Enter para finalizar la lista): ');
    if (item === '') {
      addItem = false;
    } else {
      items.push(item);
    }
  }
  users[username].lists.push({ name: listName, items });
  console.log(`Lista "${listName}" agregada.`);
}

// Eliminar lista personalizada
async function deleteList() {
  console.log('--- Eliminar lista personalizada ---');
  const username = await prompt('Ingrese el nombre de usuario: ');
  if (!users[username]) {
    console.log('El usuario no existe.');
    return;
  }
  const listName = await prompt('Ingrese el nombre de la lista a eliminar: ');
  const listIndex = users[username].lists.findIndex(list => list.name === listName);
  if (listIndex === -1) {
    console.log('La lista no existe.');
    return;
  }
  users[username].lists.splice(listIndex, 1);
  console.log(`Lista "${listName}" eliminada.`);
}

function bubbleSortUsers() {
  const userArray = Object.keys(users).map(username => {
    const user = users[username];
    const avgScore = user.scores.length 
      ? user.scores.flat().reduce((a, b) => a + b, 0) / user.scores.flat().length 
      : 0;
    return { username, avgScore };
  });

  for (let i = 0; i < userArray.length - 1; i++) {
    for (let j = 0; j < userArray.length - 1 - i; j++) {
      if (userArray[j].avgScore < userArray[j + 1].avgScore) {
        const temp = userArray[j];
        userArray[j] = userArray[j + 1];
        userArray[j + 1] = temp;
      }
    }
  }

  console.log('Usuarios ordenados por puntaje promedio:');
  userArray.forEach(user => console.log(`${user.username}: ${user.avgScore.toFixed(2)}`));
}

function searchUser(username) {
  if (users[username]) {
    console.log(`Usuario encontrado: ${username}, Puntajes:`);
    users[username].scores.forEach((scoreSet, index) => {
      console.log(`Conjunto ${index + 1}: ${scoreSet.join(', ')}`);
    });
    console.log('Listas personalizadas:');
    users[username].lists.forEach((list, index) => {
      console.log(`Lista ${index + 1}: ${list.name}, Elementos: ${list.items.join(', ')}`);
    });
  } else {
    console.log('Usuario no encontrado.');
  }
}

async function main() {
  while (true) {
    console.log('\n--- Menú Principal ---');
    console.log('1. Registrar');
    console.log('2. Iniciar sesión');
    console.log('3. Editar usuario');
    console.log('4. Eliminar usuario');
    console.log('5. Ordenar usuarios por puntaje promedio');
    console.log('6. Buscar usuario');
    console.log('7. Agregar lista personalizada');
    console.log('8. Eliminar lista personalizada');
    console.log('9. Salir');
    
    const choice = await prompt('Seleccione una opción: ');
    
    switch (choice) {
      case '1':
        await register();
        break;
      case '2':
        await login();
        break;
      case '3':
        await edit();
        break;
      case '4':
        await deleteUser();
        break;
      case '5':
        bubbleSortUsers();
        break;
      case '6':
        const searchUsername = await prompt('Ingrese el nombre de usuario a buscar: ');
        searchUser(searchUsername);
        break;
      case '7':
        await addList();
        break;
      case '8':
        await deleteList();
        break;
      case '9':
        rl.close();
        console.log('Saliendo...');
        return;
      default:
        console.log('Opción inválida.');
    }
  }
}

main();
