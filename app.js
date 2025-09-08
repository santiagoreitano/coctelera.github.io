class CocktailApp {
  constructor() {
    this.cocktails = []
    this.filteredCocktails = []
    this.selectedIngredients = []
    this.allIngredients = []
    this.families = []
    this.editingCocktail = null
    this.availableIngredients = []
    this.availableTypes = []
    this.availableFamilies = []

    this.searchTerm = ""
    this.selectedFamily = "all"
    this.selectedType = "all"
    this.scoreRange = 0
    this.ingredientMatchMode = "flexible"
    this.showFilters = false

    this.selectedImageBase64 = null

    this.init()
  }

  async init() {
    await this.loadConfig()
    await this.loadCocktails()
    this.setupEventListeners()
    this.updateFilters()
    this.renderCocktails()
    this.createIcons()
  }

  async loadConfig() {
    try {
      const response = await fetch("./config.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const config = await response.json()
      this.availableIngredients = config.ingredientes || []
      this.availableTypes = config.tipos || []
      this.availableFamilies = config.familias || []
      console.log("Loaded config from JSON file")
    } catch (error) {
      console.error("Error loading config:", error)
      // Fallback con ingredientes básicos
      this.availableIngredients = [
        "Ron blanco",
        "Vodka",
        "Gin",
        "Tequila",
        "Whisky",
        "Jugo de limón",
        "Jugo de lima",
        "Jugo de naranja",
        "Agua tónica",
        "Soda",
        "Hielo",
      ]
      this.availableTypes = ["Aperitivo", "Digestivo", "Cóctel clásico", "Refrescante"]
      this.availableFamilies = ["Clásicos", "Tropicales", "Cremosos", "Modernos"]
    }
  }

  async loadCocktails() {
    try {
      // First try to load from localStorage (for persistence)
      const savedCocktails = localStorage.getItem("cocktails")
      if (savedCocktails) {
        this.cocktails = JSON.parse(savedCocktails)
        console.log("Loaded cocktails from localStorage")
      } else {
        // If no saved data, try to load from JSON file
        const response = await fetch("./cocktails.json")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        this.cocktails = await response.json()
        console.log("Loaded cocktails from JSON file")
        // Save to localStorage for future use
        localStorage.setItem("cocktails", JSON.stringify(this.cocktails))
      }

      this.updateDerivedData()
      this.applyFilters()
    } catch (error) {
      console.error("Error loading cocktails:", error)
      // Fallback: use default data if both methods fail
      this.loadDefaultCocktails()
    }
  }

  loadDefaultCocktails() {
    this.cocktails = [
      {
        id: 1,
        nombre: "Mojito Clásico",
        tipo: "Refrescante",
        familia: "Clásicos",
        puntaje: 8.5,
        descripcion: "El cóctel cubano más famoso del mundo, refrescante y aromático con menta fresca.",
        ingredientes: [
          { cantidad: 2, unidad: "oz", nombre: "Ron blanco" },
          { cantidad: 10, unidad: "gotas", nombre: "Menta fresca" },
          { cantidad: 1, unidad: "cucharada", nombre: "Azúcar" },
          { cantidad: 0.5, unidad: "oz", nombre: "Lima" },
          { cantidad: 4, unidad: "oz", nombre: "Agua con gas" },
        ],
        preparacion: [
          "Machacar suavemente las hojas de menta con azúcar en el fondo del vaso",
          "Agregar el jugo de lima fresca",
          "Llenar el vaso con hielo picado",
          "Añadir el ron blanco y mezclar suavemente",
          "Completar con agua con gas",
          "Decorar con una ramita de menta fresca",
        ],
        dificultad: "Fácil",
        tiempo: "5 min",
        imagen: "/mojito-cocktail.png",
      },
      {
        id: 2,
        nombre: "Margarita",
        tipo: "Aperitivo",
        familia: "Clásicos",
        puntaje: 9.0,
        descripcion: "El cóctel mexicano por excelencia, perfecto equilibrio entre tequila, lima y triple sec.",
        ingredientes: [
          { cantidad: 2, unidad: "oz", nombre: "Tequila" },
          { cantidad: 1, unidad: "oz", nombre: "Triple sec" },
          { cantidad: 1, unidad: "oz", nombre: "Jugo de lima" },
          { cantidad: 1, unidad: "pizca", nombre: "Sal" },
          { cantidad: 1, unidad: "taza", nombre: "Hielo" },
        ],
        preparacion: [
          "Escarchar el borde del vaso con sal",
          "En una coctelera, agregar tequila, triple sec y jugo de lima",
          "Llenar la coctelera con hielo y agitar vigorosamente",
          "Colar en el vaso preparado con hielo fresco",
          "Decorar con una rodaja de lima",
        ],
        dificultad: "Fácil",
        tiempo: "3 min",
        imagen: "/margarita-cocktail-with-salt-rim-and-lime.jpg",
      },
    ]

    console.log("Loaded default cocktails as fallback")
    this.updateDerivedData()
    this.applyFilters()
  }

  updateDerivedData() {
    // Extract unique families
    this.families = [...new Set(this.cocktails.map((c) => c.familia))].sort()

    // Extract unique types
    this.types = [...new Set(this.cocktails.map((c) => c.tipo))].sort()

    // Extract all ingredients
    const ingredientsSet = new Set()
    this.cocktails.forEach((cocktail) => {
      cocktail.ingredientes.forEach((ingredient) => {
        const ingredientName = typeof ingredient === "string" ? ingredient : ingredient.nombre
        ingredientsSet.add(ingredientName)
      })
    })
    this.allIngredients = Array.from(ingredientsSet).sort()
  }

  setupEventListeners() {
    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchTerm = e.target.value
      this.applyFilters()
    })

    // Toggle filters
    document.getElementById("toggleFiltersBtn").addEventListener("click", () => {
      this.showFilters = !this.showFilters
      document.getElementById("filtersSidebar").classList.toggle("hidden", !this.showFilters)
    })

    // Family filter
    document.getElementById("familySelect").addEventListener("change", (e) => {
      this.selectedFamily = e.target.value
      this.applyFilters()
    })

    // Type filter
    document.getElementById("typeSelect").addEventListener("change", (e) => {
      this.selectedType = e.target.value
      this.applyFilters()
    })

    // Score filter
    const scoreSlider = document.getElementById("scoreSlider")
    scoreSlider.addEventListener("input", (e) => {
      this.scoreRange = Number.parseFloat(e.target.value)
      document.getElementById("scoreValue").textContent = this.scoreRange
      this.applyFilters()
    })

    // Match mode
    document.getElementById("matchModeSelect").addEventListener("change", (e) => {
      this.ingredientMatchMode = e.target.value
      this.applyFilters()
    })

    // Clear filters
    document.getElementById("clearFiltersBtn").addEventListener("click", () => this.clearFilters())
    document.getElementById("clearFiltersBtn2").addEventListener("click", () => this.clearFilters())

    // Form modal
    document.getElementById("addNewBtn").addEventListener("click", () => this.openForm())
    document.getElementById("closeFormModal").addEventListener("click", () => this.closeForm())
    document.getElementById("cancelFormBtn").addEventListener("click", () => this.closeForm())
    document.getElementById("cocktailForm").addEventListener("submit", (e) => this.handleFormSubmit(e))

    // Recipe modal
    document.getElementById("closeRecipeModal").addEventListener("click", () => this.closeRecipeModal())

    // Form ingredients and steps
    document.getElementById("addIngredientBtn").addEventListener("click", () => this.addIngredient())
    document.getElementById("newIngredient").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        this.addIngredient()
      }
    })

    document.getElementById("addStepBtn").addEventListener("click", () => this.addStep())

    document.getElementById("formImageFile").addEventListener("change", (e) => this.handleImageSelection(e))
  }

  handleImageSelection(event) {
    const file = event.target.files[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido.")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        this.selectedImageBase64 = e.target.result
        this.showImagePreview(e.target.result)
      }
      reader.onerror = () => {
        alert("Error al leer el archivo. Por favor intenta de nuevo.")
      }
      reader.readAsDataURL(file)
    }
  }

  showImagePreview(base64Data) {
    const previewContainer = document.getElementById("imagePreview")
    const previewImg = document.getElementById("previewImg")

    previewImg.src = base64Data
    previewContainer.classList.remove("hidden")
  }

  clearImagePreview() {
    const previewContainer = document.getElementById("imagePreview")
    const previewImg = document.getElementById("previewImg")
    const fileInput = document.getElementById("formImageFile")

    previewContainer.classList.add("hidden")
    previewImg.src = "/placeholder.svg"
    fileInput.value = ""
    this.selectedImageBase64 = null
  }

  updateFilters() {
    // Update family select
    const familySelect = document.getElementById("familySelect")
    familySelect.innerHTML = '<option value="all">Todas las familias</option>'
    this.families.forEach((family) => {
      const option = document.createElement("option")
      option.value = family
      option.textContent = family
      familySelect.appendChild(option)
    })

    // Update type select
    const typeSelect = document.getElementById("typeSelect")
    typeSelect.innerHTML = '<option value="all">Todos los tipos</option>'
    this.types.forEach((type) => {
      const option = document.createElement("option")
      option.value = type
      option.textContent = type
      typeSelect.appendChild(option)
    })

    this.updateIngredientSelect()
    this.updateFormSelects()

    // Update ingredients list
    const ingredientsList = document.getElementById("ingredientsList")
    ingredientsList.innerHTML = ""
    this.allIngredients.forEach((ingredient) => {
      const div = document.createElement("div")
      div.className = "flex items-center space-x-2"
      div.innerHTML = `
                <input type="checkbox" id="ing-${ingredient}" class="rounded" ${this.selectedIngredients.includes(ingredient) ? "checked" : ""}>
                <label for="ing-${ingredient}" class="text-sm font-medium cursor-pointer">${ingredient}</label>
            `

      div.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) {
          this.selectedIngredients.push(ingredient)
        } else {
          this.selectedIngredients = this.selectedIngredients.filter((i) => i !== ingredient)
        }
        this.updateSelectedCount()
        this.applyFilters()
      })

      ingredientsList.appendChild(div)
    })

    this.updateSelectedCount()
  }

  updateIngredientSelect() {
    const ingredientSelect = document.getElementById("newIngredient")
    ingredientSelect.innerHTML = '<option value="">Seleccionar ingrediente...</option>'

    this.availableIngredients.forEach((ingredient) => {
      const option = document.createElement("option")
      option.value = ingredient
      option.textContent = ingredient
      ingredientSelect.appendChild(option)
    })
  }

  updateFormSelects() {
    // Actualizar select de tipos
    const typeSelect = document.getElementById("formTipo")
    const currentTypeValue = typeSelect.value
    typeSelect.innerHTML = '<option value="">Seleccionar tipo...</option>'
    this.availableTypes.forEach((type) => {
      const option = document.createElement("option")
      option.value = type
      option.textContent = type
      if (type === currentTypeValue) option.selected = true
      typeSelect.appendChild(option)
    })

    // Actualizar select de familias
    const familySelect = document.getElementById("formFamilia")
    const currentFamilyValue = familySelect.value
    familySelect.innerHTML = '<option value="">Seleccionar familia...</option>'
    this.availableFamilies.forEach((family) => {
      const option = document.createElement("option")
      option.value = family
      option.textContent = family
      if (family === currentFamilyValue) option.selected = true
      familySelect.appendChild(option)
    })
  }

  applyFilters() {
    this.filteredCocktails = this.cocktails.filter((cocktail) => {
      const matchesName = cocktail.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      const matchesFamily = this.selectedFamily === "all" || cocktail.familia === this.selectedFamily
      const matchesType = this.selectedType === "all" || cocktail.tipo === this.selectedType
      const matchesScore = cocktail.puntaje >= this.scoreRange

      let matchesIngredients = true
      if (this.selectedIngredients.length > 0) {
        const cocktailIngredientNames = cocktail.ingredientes.map((ing) => (typeof ing === "string" ? ing : ing.nombre))

        if (this.ingredientMatchMode === "strict") {
          matchesIngredients =
            this.selectedIngredients.every((ingredient) => cocktailIngredientNames.includes(ingredient)) &&
            cocktailIngredientNames.every((ingredient) => this.selectedIngredients.includes(ingredient))
        } else {
          matchesIngredients = this.selectedIngredients.some((ingredient) =>
            cocktailIngredientNames.includes(ingredient),
          )
        }
      }

      return matchesName && matchesFamily && matchesType && matchesScore && matchesIngredients
    })

    this.renderCocktails()
  }

  renderCocktails() {
    const grid = document.getElementById("cocktailsGrid")
    const noResults = document.getElementById("noResults")
    const resultsCount = document.getElementById("resultsCount")

    resultsCount.textContent = `${this.filteredCocktails.length} cóctel${this.filteredCocktails.length !== 1 ? "es" : ""} encontrado${this.filteredCocktails.length !== 1 ? "s" : ""}`

    if (this.filteredCocktails.length === 0) {
      grid.innerHTML = ""
      noResults.classList.remove("hidden")
      return
    }

    noResults.classList.add("hidden")
    grid.innerHTML = ""

    this.filteredCocktails.forEach((cocktail) => {
      const card = this.createCocktailCard(cocktail)
      grid.appendChild(card)
    })

    this.createIcons()
  }

  createCocktailCard(cocktail) {
    const card = document.createElement("div")
    card.className = "cocktail-card bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm fade-in"

    const ingredientsBadges = cocktail.ingredientes
      .slice(0, 3)
      .map((ing) => {
        const ingredientText = typeof ing === "string" ? ing : `${ing.cantidad} ${ing.unidad} ${ing.nombre}`
        return `<span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">${ingredientText}</span>`
      })
      .join("")

    const moreBadge =
      cocktail.ingredientes.length > 3
        ? `<span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">+${cocktail.ingredientes.length - 3} más</span>`
        : ""

    const imageSource =
      cocktail.imagen && cocktail.imagen.startsWith("data:")
        ? cocktail.imagen
        : cocktail.imagen || "/colorful-cocktail-drink.jpg"

    card.innerHTML = `
            <div class="aspect-square overflow-hidden relative">
                <img src="${imageSource}" 
                     alt="${cocktail.nombre}" 
                     class="w-full h-full object-cover transition-transform hover:scale-105"
                     loading="lazy">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 flex items-center gap-1">
                    <i data-lucide="star" class="h-3 w-3 fill-yellow-400 text-yellow-400"></i>
                    <span class="text-xs font-bold">${cocktail.puntaje}</span>
                </div>
            </div>
            <div class="p-5">
                <div class="mb-3">
                    <h3 class="text-xl font-bold text-gray-900 mb-1">${cocktail.nombre}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2">${cocktail.descripcion}</p>
                </div>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">${cocktail.familia}</span>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <div class="flex items-center gap-1">
                                <i data-lucide="clock" class="h-3 w-3"></i>
                                ${cocktail.tiempo}
                            </div>
                            <div class="flex items-center gap-1">
                                <i data-lucide="gauge" class="h-3 w-3"></i>
                                ${cocktail.dificultad}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p class="text-sm font-medium mb-2 text-gray-700">Ingredientes principales:</p>
                        <div class="flex flex-wrap gap-1">
                            ${ingredientsBadges}
                            ${moreBadge}
                        </div>
                    </div>

                    <div class="flex gap-2 pt-2">
                        <button class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md" onclick="app.openRecipeModal(${cocktail.id})">
                            <i data-lucide="book-open" class="h-4 w-4 inline mr-1"></i>
                            Ver receta
                        </button>
                        <button class="border border-gray-300 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors" onclick="app.editCocktail(${cocktail.id})" title="Editar">
                            <i data-lucide="edit" class="h-4 w-4"></i>
                        </button>
                        <button class="border border-red-200 text-red-600 px-3 py-2.5 rounded-lg text-sm hover:bg-red-50 transition-colors" onclick="app.deleteCocktail(${cocktail.id})" title="Eliminar">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `

    return card
  }

  openRecipeModal(id) {
    const cocktail = this.cocktails.find((c) => c.id === id)
    if (!cocktail) return

    document.getElementById("recipeTitle").innerHTML = `
            <i data-lucide="chef-hat" class="h-6 w-6"></i>
            ${cocktail.nombre}
        `

    const ingredientsList = cocktail.ingredientes
      .map((ing, index) => {
        let ingredientText
        if (typeof ing === "string") {
          // Compatibilidad con datos antiguos
          ingredientText = ing
        } else {
          // Mostrar cantidad, unidad e ingrediente
          ingredientText = `<strong>${ing.cantidad} ${ing.unidad}</strong> de ${ing.nombre}`
        }
        return `
            <div class="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div class="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0"></div>
                <span class="text-sm">${ingredientText}</span>
            </div>
        `
      })
      .join("")

    const stepsList = cocktail.preparacion
      .map(
        (step, index) => `
            <li class="flex gap-3">
                <div class="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    ${index + 1}
                </div>
                <p class="text-sm leading-relaxed">${step}</p>
            </li>
        `,
      )
      .join("")

    const imageSource =
      cocktail.imagen && cocktail.imagen.startsWith("data:")
        ? cocktail.imagen
        : cocktail.imagen || "/colorful-cocktail-drink.jpg"

    document.getElementById("recipeContent").innerHTML = `
            <p class="text-gray-600 mb-6">${cocktail.descripcion}</p>
            
            <div class="aspect-video overflow-hidden rounded-lg mb-6">
                <img src="${imageSource}" alt="${cocktail.nombre}" class="w-full h-full object-cover">
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-3 bg-gray-100 rounded-lg">
                    <i data-lucide="star" class="h-5 w-5 mx-auto mb-1 fill-yellow-400 text-yellow-400"></i>
                    <p class="text-sm font-medium">Puntaje</p>
                    <p class="text-lg font-bold">${cocktail.puntaje}/10</p>
                </div>
                <div class="text-center p-3 bg-gray-100 rounded-lg">
                    <i data-lucide="clock" class="h-5 w-5 mx-auto mb-1"></i>
                    <p class="text-sm font-medium">Tiempo</p>
                    <p class="text-lg font-bold">${cocktail.tiempo}</p>
                </div>
                <div class="text-center p-3 bg-gray-100 rounded-lg">
                    <i data-lucide="gauge" class="h-5 w-5 mx-auto mb-1"></i>
                    <p class="text-sm font-medium">Dificultad</p>
                    <p class="text-lg font-bold">${cocktail.dificultad}</p>
                </div>
                <div class="text-center p-3 bg-gray-100 rounded-lg">
                    <i data-lucide="glass-water" class="h-5 w-5 mx-auto mb-1"></i>
                    <p class="text-sm font-medium">Tipo</p>
                    <p class="text-lg font-bold">${cocktail.tipo}</p>
                </div>
            </div>

            <div class="mb-6">
                <span class="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">${cocktail.familia}</span>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="shopping-cart" class="h-5 w-5"></i>
                    Ingredientes
                </h3>
                <div class="grid grid-cols-1 gap-2">
                    ${ingredientsList}
                </div>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="chef-hat" class="h-5 w-5"></i>
                    Preparación
                </h3>
                <ol class="space-y-3">
                    ${stepsList}
                </ol>
            </div>
        `

    document.getElementById("recipeModal").classList.add("show")
    this.createIcons()
  }

  closeRecipeModal() {
    document.getElementById("recipeModal").classList.remove("show")
  }

  openForm(cocktail = null) {
    this.editingCocktail = cocktail

    if (cocktail) {
      document.getElementById("formTitle").textContent = "Editar Cóctel"
      document.getElementById("submitFormBtn").textContent = "Actualizar Cóctel"
      this.populateForm(cocktail)
    } else {
      document.getElementById("formTitle").textContent = "Nuevo Cóctel"
      document.getElementById("submitFormBtn").textContent = "Crear Cóctel"
      this.clearForm()
    }

    this.updateIngredientSelect()
    this.updateFormSelects()
    document.getElementById("formModal").classList.add("show")
    this.createIcons()
  }

  closeForm() {
    document.getElementById("formModal").classList.remove("show")
    this.editingCocktail = null
  }

  populateForm(cocktail) {
    document.getElementById("formNombre").value = cocktail.nombre
    document.getElementById("formTipo").value = cocktail.tipo
    document.getElementById("formFamilia").value = cocktail.familia
    document.getElementById("formPuntaje").value = cocktail.puntaje
    document.getElementById("formDescripcion").value = cocktail.descripcion
    document.getElementById("formDificultad").value = cocktail.dificultad
    document.getElementById("formTiempo").value = cocktail.tiempo

    if (cocktail.imagen && cocktail.imagen.startsWith("data:")) {
      this.selectedImageBase64 = cocktail.imagen
      this.showImagePreview(cocktail.imagen)
    } else {
      this.clearImagePreview()
    }

    this.formIngredients = cocktail.ingredientes.map((ing) =>
      typeof ing === "string" ? { cantidad: 1, unidad: "oz", nombre: ing } : ing,
    )
    this.formSteps = [...cocktail.preparacion]
    this.updateFormIngredients()
    this.updateFormSteps()
  }

  clearForm() {
    document.getElementById("cocktailForm").reset()
    document.getElementById("formPuntaje").value = 5
    this.formIngredients = []
    this.formSteps = []
    this.clearImagePreview()
    this.updateFormIngredients()
    this.updateFormSteps()
    this.updateIngredientSelect()
  }

  addIngredient() {
    const quantityInput = document.getElementById("newIngredientQuantity")
    const unitSelect = document.getElementById("newIngredientUnit")
    const nameSelect = document.getElementById("newIngredient")

    const quantity = Number.parseFloat(quantityInput.value) || 1
    const unit = unitSelect.value
    const name = nameSelect.value.trim()

    if (name) {
      this.formIngredients = this.formIngredients || []
      this.formIngredients.push({
        cantidad: quantity,
        unidad: unit,
        nombre: name,
      })

      quantityInput.value = ""
      nameSelect.value = ""
      unitSelect.value = "oz"
      this.updateFormIngredients()
    }
  }

  removeIngredient(index) {
    this.formIngredients.splice(index, 1)
    this.updateFormIngredients()
  }

  updateFormIngredients() {
    const container = document.querySelector("#formModal #ingredientsList")
    container.innerHTML = ""
    this.formIngredients.forEach((ingredient, index) => {
      const ingredientDiv = document.createElement("div")
      ingredientDiv.className = "bg-gray-100 p-3 rounded-lg border"

      const ingredientText =
        typeof ingredient === "string" ? ingredient : `${ingredient.cantidad} ${ingredient.unidad} ${ingredient.nombre}`

      ingredientDiv.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-medium text-gray-700">Ingrediente ${index + 1}:</span>
          <button type="button" class="ml-auto text-red-500 hover:text-red-700" onclick="app.removeIngredient(${index})" title="Eliminar ingrediente">
            <i data-lucide="trash-2" class="h-4 w-4"></i>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Cantidad</label>
            <input type="number" 
                   value="${typeof ingredient === "string" ? 1 : ingredient.cantidad}" 
                   step="0.1" 
                   min="0.1"
                   class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                   onchange="app.updateIngredientField(${index}, 'cantidad', this.value)">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Unidad</label>
            <select class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onchange="app.updateIngredientField(${index}, 'unidad', this.value)">
              <option value="oz" ${typeof ingredient !== "string" && ingredient.unidad === "oz" ? "selected" : ""}>oz (onzas)</option>
              <option value="ml" ${typeof ingredient !== "string" && ingredient.unidad === "ml" ? "selected" : ""}>ml (mililitros)</option>
              <option value="gotas" ${typeof ingredient !== "string" && ingredient.unidad === "gotas" ? "selected" : ""}>gotas</option>
              <option value="dash" ${typeof ingredient !== "string" && ingredient.unidad === "dash" ? "selected" : ""}>dash</option>
              <option value="cucharada" ${typeof ingredient !== "string" && ingredient.unidad === "cucharada" ? "selected" : ""}>cucharada</option>
              <option value="cucharadita" ${typeof ingredient !== "string" && ingredient.unidad === "cucharadita" ? "selected" : ""}>cucharadita</option>
              <option value="taza" ${typeof ingredient !== "string" && ingredient.unidad === "taza" ? "selected" : ""}>taza</option>
              <option value="pizca" ${typeof ingredient !== "string" && ingredient.unidad === "pizca" ? "selected" : ""}>pizca</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Ingrediente</label>
            <select class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onchange="app.updateIngredientField(${index}, 'nombre', this.value)">
              <option value="">Seleccionar...</option>
              ${this.availableIngredients
                .map(
                  (ing) => `
                <option value="${ing}" ${(typeof ingredient === "string" ? ingredient === ing : ingredient.nombre === ing) ? "selected" : ""}>${ing}</option>
              `,
                )
                .join("")}
            </select>
          </div>
        </div>
      `

      container.appendChild(ingredientDiv)
    })
    this.createIcons()
  }

  updateIngredientField(index, field, value) {
    if (this.formIngredients[index]) {
      // Convertir a objeto si es string
      if (typeof this.formIngredients[index] === "string") {
        this.formIngredients[index] = {
          cantidad: 1,
          unidad: "oz",
          nombre: this.formIngredients[index],
        }
      }

      // Actualizar el campo específico
      if (field === "cantidad") {
        this.formIngredients[index][field] = Number.parseFloat(value) || 1
      } else {
        this.formIngredients[index][field] = value
      }
    }
  }

  addStep() {
    const input = document.getElementById("newStep")
    const step = input.value.trim()
    if (step) {
      this.formSteps = this.formSteps || []
      this.formSteps.push(step)
      input.value = ""
      this.updateFormSteps()
    }
  }

  removeStep(index) {
    this.formSteps.splice(index, 1)
    this.updateFormSteps()
  }

  updateFormSteps() {
    const container = document.getElementById("stepsList")
    container.innerHTML = ""
    this.formSteps.forEach((step, index) => {
      const div = document.createElement("div")
      div.className = "flex items-start gap-2 p-2 bg-gray-100 rounded"
      div.innerHTML = `
                <span class="font-medium text-sm">${index + 1}.</span>
                <span class="flex-1 text-sm">${step}</span>
                <i data-lucide="x" class="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700" onclick="app.removeStep(${index})"></i>
            `
      container.appendChild(div)
    })
    this.createIcons()
  }

  async handleFormSubmit(e) {
    e.preventDefault()

    const formData = {
      nombre: document.getElementById("formNombre").value,
      tipo: document.getElementById("formTipo").value,
      familia: document.getElementById("formFamilia").value,
      puntaje: Number.parseFloat(document.getElementById("formPuntaje").value),
      descripcion: document.getElementById("formDescripcion").value,
      dificultad: document.getElementById("formDificultad").value,
      tiempo: document.getElementById("formTiempo").value,
      imagen: this.selectedImageBase64 || "/colorful-cocktail-drink.jpg",
      ingredientes: this.formIngredients || [],
      preparacion: this.formSteps || [],
    }

    if (this.editingCocktail) {
      formData.id = this.editingCocktail.id
      await this.updateCocktail(formData)
    } else {
      await this.createCocktail(formData)
    }

    this.closeForm()
  }

  async createCocktail(cocktailData) {
    // Generate new ID
    const maxId = Math.max(...this.cocktails.map((c) => c.id), 0)
    cocktailData.id = maxId + 1

    this.cocktails.push(cocktailData)
    await this.saveCocktails()
    this.updateDerivedData()
    this.updateFilters()
    this.applyFilters()
  }

  async updateCocktail(cocktailData) {
    const index = this.cocktails.findIndex((c) => c.id === cocktailData.id)
    if (index !== -1) {
      this.cocktails[index] = cocktailData
      await this.saveCocktails()
      this.updateDerivedData()
      this.updateFilters()
      this.applyFilters()
    }
  }

  async deleteCocktail(id) {
    if (confirm("¿Estás seguro de que quieres eliminar este cóctel?")) {
      this.cocktails = this.cocktails.filter((c) => c.id !== id)
      await this.saveCocktails()
      this.updateDerivedData()
      this.updateFilters()
      this.applyFilters()
    }
  }

  editCocktail(id) {
    const cocktail = this.cocktails.find((c) => c.id === id)
    if (cocktail) {
      this.openForm(cocktail)
    }
  }

  async saveCocktails() {
    try {
      localStorage.setItem("cocktails", JSON.stringify(this.cocktails))
      console.log("Cocktails saved to localStorage successfully")
    } catch (error) {
      console.error("Error saving cocktails to localStorage:", error)
      alert("Error al guardar los datos. Por favor, inténtalo de nuevo.")
    }
  }

  clearFilters() {
    this.searchTerm = ""
    this.selectedFamily = "all"
    this.selectedType = "all"
    this.scoreRange = 0
    this.selectedIngredients = []
    this.ingredientMatchMode = "flexible"

    document.getElementById("searchInput").value = ""
    document.getElementById("familySelect").value = "all"
    document.getElementById("typeSelect").value = "all"
    document.getElementById("scoreSlider").value = 0
    document.getElementById("scoreValue").textContent = "0"
    document.getElementById("matchModeSelect").value = "flexible"

    // Clear ingredient checkboxes
    document.querySelectorAll('#ingredientsList input[type="checkbox"]').forEach((cb) => {
      cb.checked = false
    })

    this.updateSelectedCount()
    this.applyFilters()
  }

  createIcons() {
    const lucide = window.lucide // Declare lucide variable
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  }
}

// Initialize the app
const app = new CocktailApp()
