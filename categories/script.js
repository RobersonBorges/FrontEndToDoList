const categoryForm = document.getElementById('categoryForm');
const messageDiv = document.getElementById('message');
const consultarCategoriasButton = document.getElementById('consultarCategorias');
const categoriesTable = document.getElementById('categoriesTable');
const categoriesTableBody = categoriesTable.querySelector('tbody');

categoryForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    const nameCategory = document.getElementById('nameCategory').value;

    fetch('http://localhost:8080/categories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nameCategory: nameCategory })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error); });
        }
        return response.json();
    })
    .then(data => {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Categoria criada com sucesso!';
        messageDiv.style.color = 'green';
        categoryForm.reset(); // Limpa o campo de texto
        consultarCategorias(); // Atualiza a tabela
    })
    .catch(error => {
        messageDiv.style.display = 'block';
        if (error.message.includes('Categoria já existe')) {
            messageDiv.textContent = 'Erro: Categoria já existe!';
        } else {
            messageDiv.textContent = 'Erro ao criar categoria: ' + error.message;
        }
        messageDiv.style.color = 'red';
    });
});

consultarCategoriasButton.addEventListener('click', consultarCategorias);

function consultarCategorias() {
    fetch('http://localhost:8080/categories', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        categoriesTable.style.display = 'table';
        categoriesTableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novas linhas
        data.forEach(category => {
            const row = document.createElement('tr');
            const idCell = document.createElement('td');
            const nameCell = document.createElement('td');
            const actionsCell = document.createElement('td');

            idCell.textContent = category.codCategory;
            nameCell.textContent = category.nameCategory;

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => {
                nameCell.innerHTML = `<input type="text" value="${category.nameCategory}">`;
                editButton.style.display = 'none';
                saveButton.style.display = 'inline';
            });

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Salvar';
            saveButton.style.display = 'none';
            saveButton.addEventListener('click', () => {
                const newName = nameCell.querySelector('input').value;
                editarCategoria(category.codCategory, newName, editButton, saveButton, nameCell);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.addEventListener('click', () => excluirCategoria(category.codCategory));

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(saveButton);
            actionsCell.appendChild(deleteButton);

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(actionsCell);
            categoriesTableBody.appendChild(row);
        });
    })
    .catch(error => {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Erro ao consultar categorias: ' + error.message;
        messageDiv.style.color = 'red';
    });
}

function editarCategoria(id, newName, editButton, saveButton, nameCell) {
    if (newName.trim() === "") {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Erro: O nome da categoria não pode estar vazio!';
        messageDiv.style.color = 'red';
        return; 
    }
    fetch(`http://localhost:8080/categories/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nameCategory: newName })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error); });
        }
        return response.json();
    })
    .then(data => {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Categoria atualizada com sucesso!';
        messageDiv.style.color = 'green';
        nameCell.textContent = newName; // Atualiza o nome na tabela
        editButton.style.display = 'inline';
        saveButton.style.display = 'none';
    })
    .catch(error => {
        messageDiv.style.display = 'block';
        if (error.message.includes('Categoria já existe')) {
            messageDiv.textContent = 'Erro: Categoria já existe!';
        } else {
            messageDiv.textContent = 'Erro ao atualizar categoria: ' + error.message;
        }
        messageDiv.style.color = 'red';
    });
}

function excluirCategoria(id) {
    fetch(`http://localhost:8080/categories/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error); });
        }
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Categoria excluída com sucesso!';
        messageDiv.style.color = 'green';
        consultarCategorias(); // Atualiza a tabela
    })
    .catch(error => {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Erro ao excluir categoria: ' + error.message;
        messageDiv.style.color = 'red';
    });
}
