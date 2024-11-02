document.addEventListener("DOMContentLoaded", () => {
  const todoTasksDiv = document.getElementById("todoTasks");
  const doingTasksDiv = document.getElementById("doingTasks");
  const pendingTasksDiv = document.getElementById("pendingTasks");
  const doneTasksDiv = document.getElementById("doneTasks");
  const criarTarefaButton = document.getElementById("criarTarefa");

  let currentTaskId = null;

  criarTarefaButton.addEventListener("click", criarTarefaModal);

  consultarTarefas();

  const columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    column.addEventListener("dragover", (event) => event.preventDefault());
    column.addEventListener("drop", handleDrop);
  });

  function criarTarefaModal() {
    const titleInput = createInputElement(
      "Título da Tarefa",
      "titleInput",
      true
    );
    const descriptionInput = createInputElement(
      "Descrição da Tarefa",
      "descriptionInput"
    );

    const saveButton = createButtonElement("Salvar", () => {
      const title = titleInput.value;
      const description = descriptionInput.value || "";

      if (title) {
        criarNovaTarefa(title, description);
        todoTasksDiv.removeChild(titleInput);
        todoTasksDiv.removeChild(descriptionInput);
        todoTasksDiv.removeChild(saveButton);
      } else {
        alert("Preencha o título!");
      }
    });

    todoTasksDiv.appendChild(titleInput);
    todoTasksDiv.appendChild(descriptionInput);
    todoTasksDiv.appendChild(saveButton);
  }

  function criarNovaTarefa(title, description) {
    fetch("http://localhost:8080/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        description: description,
        enumStatus: "TODO",
        categoryIds: [],
      }),
    })
      .then((response) => response.json())
      .then(exibirTarefa)
      .catch((error) => console.error("Erro ao criar tarefa:", error));
  }

  function exibirTarefa(tarefa) {
    const tarefaDiv = document.createElement("div");
    tarefaDiv.className = "card";
    tarefaDiv.draggable = true;
    tarefaDiv.dataset.id = tarefa.codTask;
    tarefaDiv.dataset.status = tarefa.enumStatus;
    tarefaDiv.addEventListener("dragstart", dragStart);

    const tarefaTitulo = document.createElement("h3");
    tarefaTitulo.textContent = tarefa.title;
    tarefaDiv.appendChild(tarefaTitulo);

    const tarefaDescricao = document.createElement("p");
    tarefaDescricao.textContent = tarefa.description;
    tarefaDiv.appendChild(tarefaDescricao);

    if (tarefa.categories && tarefa.categories.length > 0) {
      const categoriesList = document.createElement("ul");
      tarefa.categories.forEach((category) => {
        const categoryItem = document.createElement("li");
        categoryItem.textContent = category.nameCategory;
        categoriesList.appendChild(categoryItem);
      });
      tarefaDiv.appendChild(categoriesList);
    } else {
      const noCategories = document.createElement("p");
      noCategories.textContent = "Sem categorias";
      tarefaDiv.appendChild(noCategories);
    }

    const addCategoryButton = document.createElement("button");
    addCategoryButton.textContent = "Adicionar Categoria";
    addCategoryButton.addEventListener("click", () => {
      currentTaskId = tarefa.codTask;
      openCategoryModal();
    });

    tarefaDiv.appendChild(addCategoryButton);

    appendTaskToColumn(tarefaDiv, tarefa.enumStatus);
  }

  function consultarTarefas() {
    fetch("http://localhost:8080/tasks", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => data.forEach(exibirTarefa))
      .catch((error) => console.error("Erro ao consultar tarefas:", error));
  }

  function appendTaskToColumn(tarefaDiv, status) {
    if (status === "TODO") {
      todoTasksDiv.appendChild(tarefaDiv);
    } else if (status === "DOING") {
      doingTasksDiv.appendChild(tarefaDiv);
    } else if (status === "PENDING") {
      pendingTasksDiv.appendChild(tarefaDiv);
    } else if (status === "DONE") {
      doneTasksDiv.appendChild(tarefaDiv);
    }
  }

  function dragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.id);
    event.dataTransfer.setData("status", event.target.dataset.status);
  }

  function handleDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const newStatus = event.target
      .closest(".column")
      .querySelector(".task-container")
      .id.replace("Tasks", "")
      .toUpperCase();
    const tarefaDiv = document.querySelector(`[data-id='${id}']`);
    tarefaDiv.dataset.status = newStatus;
    if (newStatus === "PENDING") {
      openJustificationModal(id);
    } else {
      event.target
        .closest(".column")
        .querySelector(".task-container")
        .appendChild(tarefaDiv);
      atualizarStatusTarefa(id, newStatus);
    }
  }

  function openJustificationModal(taskId) {
    const justificationModal = document.getElementById("justificationModal");
    justificationModal.style.display = "block";
    const saveJustificationButton =
      document.getElementById("saveJustification");
    saveJustificationButton.onclick = () => {
      const justificationText =
        document.getElementById("justificationText").value;
      if (justificationText) {
        atualizarStatusComJustificativa(taskId, "PENDING", justificationText);
        justificationModal.style.display = "none";
      } else {
        alert("Justificativa é obrigatória ao mover para PENDING");
      }
    };
    const closeModalButton = document.querySelector(".close");
    closeModalButton.onclick = function () {
      justificationModal.style.display = "none";
    };
    window.onclick = function (event) {
      if (event.target == justificationModal) {
        justificationModal.style.display = "none";
      }
    };
  }

  function atualizarStatusComJustificativa(id, newStatus, justification) {
    fetch(`http://localhost:8080/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enumStatus: newStatus,
        justifications: [{ description: justification }],
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw new Error(error);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Status atualizado com sucesso:", data);
        const tarefaDiv = document.querySelector(`[data-id='${id}']`);
        document
          .getElementById(`${newStatus.toLowerCase()}Tasks`)
          .appendChild(tarefaDiv);
      })
      .catch((error) =>
        console.error("Erro ao atualizar status da tarefa:", error)
      );
  }

  function atualizarStatusTarefa(id, newStatus) {
    fetch(`http://localhost:8080/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enumStatus: newStatus }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw new Error(error);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Status atualizado com sucesso:", data);
      })
      .catch((error) =>
        console.error("Erro ao atualizar status da tarefa:", error)
      );
  }

  // Funções utilitárias
  function createInputElement(placeholder, id, required = false) {
    const input = document.createElement("input");
    input.placeholder = placeholder;
    input.id = id;
    if (required) input.required = true;
    return input;
  }

  function createButtonElement(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  const categoryModal = document.getElementById("categoryModal");
  const categoryOptionsDiv = document.getElementById("categoryOptions");
  const saveCategoriesButton = document.getElementById("saveCategories");

  function openCategoryModal() {
    categoryOptionsDiv.innerHTML = "";
    fetch("http://localhost:8080/categories", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((categories) => {
        categories.forEach((category) => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = category.codCategory;
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(category.nameCategory));
          categoryOptionsDiv.appendChild(label);
          categoryOptionsDiv.appendChild(document.createElement("br"));
        });
      })
      .catch((error) => console.error("Erro ao buscar categorias:", error));

    categoryModal.style.display = "block";
  }

  const closeModalButton = document.querySelector(".close");
  closeModalButton.onclick = function () {
    categoryModal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == categoryModal) {
      categoryModal.style.display = "none";
    }
  };

  saveCategoriesButton.addEventListener("click", () => {
    const selectedCategoryIds = Array.from(
      categoryOptionsDiv.querySelectorAll('input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);

    if (currentTaskId) {
      fetch(`http://localhost:8080/tasks/${currentTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: selectedCategoryIds }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Categorias adicionadas com sucesso:", data);
          categoryModal.style.display = "none";
        })
        .catch((error) =>
          console.error("Erro ao adicionar categorias à tarefa:", error)
        );
    }
  });
});
