const supabaseClient = window.supabase.createClient(
  window.VT_CONFIG.SUPABASE_URL,
  window.VT_CONFIG.SUPABASE_ANON_KEY
);

// =========================
// ELEMENTOS
// =========================

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const loginMessage = document.getElementById("loginMessage");

const productMessage = document.getElementById("productMessage");

const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");

const productImages = document.getElementById("productImages");
const imagePreview = document.getElementById("imagePreview");

const productPromotion = document.getElementById("productPromotion");
const productActive = document.getElementById("productActive");

const saveProductButton =
  document.getElementById("saveProductButton");

const cancelEditButton =
  document.getElementById("cancelEditButton");

const formTitle =
  document.getElementById("formTitle");

const adminProducts =
  document.getElementById("adminProducts");

// Fotos selecionadas no computador
let selectedFiles = [];

// Fotos já cadastradas no produto
let existingImages = [];


// =========================
// MENSAGENS
// =========================

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
}

function hideMessage(element) {
  element.textContent = "";
  element.className = "message";
}


// =========================
// LOGIN
// =========================

loginButton.addEventListener("click", async () => {

  hideMessage(loginMessage);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {

    showMessage(
      loginMessage,
      "Preencha o e-mail e a senha.",
      "error"
    );

    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Entrando...";

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  loginButton.disabled = false;
  loginButton.textContent = "Entrar no painel";

  if (error) {

    console.error(error);

    showMessage(
      loginMessage,
      "E-mail ou senha incorretos.",
      "error"
    );

    return;
  }

  await checkSession();

});


loginPassword.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    loginButton.click();
  }

});


// =========================
// LOGOUT
// =========================

logoutButton.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  showLogin();

});


// =========================
// SESSÃO
// =========================

async function checkSession() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {

    showAdmin();

    loadAdminProducts();

  } else {

    showLogin();

  }

}


function showLogin() {

  loginSection.classList.remove("hidden");

  adminSection.classList.add("hidden");

}


function showAdmin() {

  loginSection.classList.add("hidden");

  adminSection.classList.remove("hidden");

}


// =========================
// SELEÇÃO DAS FOTOS
// =========================

productImages.addEventListener("change", event => {

  const files = Array.from(event.target.files || []);

  selectedFiles = files;

  renderImagePreview();

});


function renderImagePreview() {

  imagePreview.innerHTML = "";

  if (selectedFiles.length === 0) {

    return;

  }

  selectedFiles.forEach((file, index) => {

    const reader = new FileReader();

    reader.onload = event => {

      const wrapper = document.createElement("div");

      wrapper.style.position = "relative";

      wrapper.style.borderRadius = "12px";

      wrapper.style.overflow = "hidden";

      wrapper.style.border =
        "1px solid var(--border)";

      wrapper.style.background =
        "#0b0d13";


      wrapper.innerHTML = `

        <img
          src="${event.target.result}"
          style="
            width:100%;
            height:110px;
            object-fit:cover;
            display:block;
          "
        >

        <button
          type="button"
          style="
            position:absolute;
            top:5px;
            right:5px;
            width:28px;
            height:28px;
            border-radius:50%;
            border:none;
            background:#35131b;
            color:#fff;
            cursor:pointer;
            font-weight:bold;
          "
        >
          ×
        </button>

      `;


      wrapper
        .querySelector("button")
        .addEventListener("click", () => {

          selectedFiles.splice(index, 1);

          renderImagePreview();

        });


      imagePreview.appendChild(wrapper);

    };

    reader.readAsDataURL(file);

  });

}


// =========================
// CARREGAR PRODUTOS
// =========================

async function loadAdminProducts() {

  adminProducts.innerHTML = `
    <p style="color: var(--muted);">
      Carregando produtos...
    </p>
  `;


  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    adminProducts.innerHTML = `
      <p style="color:#ff7185;">
        Erro ao carregar produtos.
      </p>
    `;

    return;
  }


  if (!data || data.length === 0) {

    adminProducts.innerHTML = `
      <p style="color: var(--muted);">
        Nenhum produto cadastrado.
      </p>
    `;

    return;
  }


  adminProducts.innerHTML = "";


  for (const product of data) {

    const element =
      await createAdminProduct(product);

    adminProducts.appendChild(element);

  }

}


// =========================
// CARD DO PRODUTO
// =========================

async function createAdminProduct(product) {

  const element =
    document.createElement("div");

  element.className = "admin-product";


  const price =
    Number(product.price || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );


  const status =
    product.active
      ? `<span class="status active">VISÍVEL</span>`
      : `<span class="status inactive">OCULTO</span>`;


  const promotion =
    product.promotion
      ? `<span class="status active">OFERTA</span>`
      : "";


  // Buscar quantidade de fotos
  const {
    data: images
  } = await supabaseClient
    .from("product_images")
    .select("id")
    .eq("product_id", product.id);


  const imageCount =
    images ? images.length : 0;


  element.innerHTML = `

    <div class="admin-product-info">

      <h3>
        ${escapeHTML(product.name)}
      </h3>

      <p>
        ${escapeHTML(product.category)}
        • Estoque: ${product.stock}
        • 📸 ${imageCount} foto(s)
      </p>

      <div class="admin-product-price">
        ${price}
      </div>

      ${status}

      ${promotion}

    </div>


    <div class="admin-product-actions">

      <button
        class="btn btn-gray edit-button"
      >
        Editar
      </button>

      <button
        class="btn btn-danger delete-button"
      >
        Excluir
      </button>

    </div>

  `;


  element
    .querySelector(".edit-button")
    .addEventListener(
      "click",
      () => editProduct(product)
    );


  element
    .querySelector(".delete-button")
    .addEventListener(
      "click",
      () => deleteProduct(product)
    );


  return element;

}


// =========================
// SALVAR PRODUTO
// =========================

saveProductButton.addEventListener(
  "click",
  saveProduct
);


async function saveProduct() {

  hideMessage(productMessage);


  const name =
    productName.value.trim();

  const category =
    productCategory.value;

  const description =
    productDescription.value.trim();

  const price =
    Number(productPrice.value);

  const stock =
    Number(productStock.value);

  const promotion =
    productPromotion.checked;

  const active =
    productActive.checked;


  if (!name) {

    showMessage(
      productMessage,
      "Digite o nome do produto.",
      "error"
    );

    return;
  }


  if (isNaN(price) || price < 0) {

    showMessage(
      productMessage,
      "Digite um preço válido.",
      "error"
    );

    return;
  }


  if (isNaN(stock) || stock < 0) {

    showMessage(
      productMessage,
      "Digite um estoque válido.",
      "error"
    );

    return;
  }


  saveProductButton.disabled = true;

  saveProductButton.textContent =
    "Salvando...";


  try {

    const productData = {

      name,
      category,
      description,
      price,
      stock,
      promotion,
      active,
      updated_at:
        new Date().toISOString()

    };


    let savedProduct;


    // =========================
    // ATUALIZAR
    // =========================

    if (productId.value) {

      const { data, error } =
        await supabaseClient
          .from("products")
          .update(productData)
          .eq("id", productId.value)
          .select()
          .single();


      if (error) {
        throw error;
      }


      savedProduct = data;

    }


    // =========================
    // NOVO PRODUTO
    // =========================

    else {

      const { data, error } =
        await supabaseClient
          .from("products")
          .insert(productData)
          .select()
          .single();


      if (error) {
        throw error;
      }


      savedProduct = data;

    }


    // =========================
    // UPLOAD DAS FOTOS
    // =========================

    if (selectedFiles.length > 0) {

      for (
        let i = 0;
        i < selectedFiles.length;
        i++
      ) {

        const file =
          selectedFiles[i];


        const extension =
          file.name
            .split(".")
            .pop()
            .toLowerCase();


        const fileName =
          `${crypto.randomUUID()}.${extension}`;


        const filePath =
          `${savedProduct.id}/${fileName}`;


        // Enviar para Storage
        const {
          error: uploadError
        } = await supabaseClient.storage
          .from("product-images")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false
            }
          );


        if (uploadError) {

          console.error(uploadError);

          continue;

        }


        // URL pública
        const {
          data: publicUrlData
        } = supabaseClient.storage
          .from("product-images")
          .getPublicUrl(filePath);


        const imageUrl =
          publicUrlData.publicUrl;


        // Salvar relação no banco
        const {
          error: imageError
        } = await supabaseClient
          .from("product_images")
          .insert({

            product_id:
              savedProduct.id,

            image_url:
              imageUrl

          });


        if (imageError) {

          console.error(imageError);

        }

      }

    }


    // =========================
    // PRIMEIRA FOTO = PRINCIPAL
    // =========================

    await updateMainImage(
      savedProduct.id
    );


    showMessage(
      productMessage,
      productId.value
        ? "Produto atualizado com sucesso!"
        : "Produto cadastrado com sucesso!",
      "success"
    );


    resetForm();

    await loadAdminProducts();


  } catch (error) {

    console.error(error);

    showMessage(
      productMessage,
      "Não foi possível salvar o produto.",
      "error"
    );

  }


  saveProductButton.disabled = false;

  saveProductButton.textContent =
    "Salvar produto";

}


// =========================
// DEFINIR FOTO PRINCIPAL
// =========================

async function updateMainImage(productIdValue) {

  const {
    data,
    error
  } = await supabaseClient
    .from("product_images")
    .select("image_url")
    .eq("product_id", productIdValue)
    .order("created_at", {
      ascending: true
    })
    .limit(1);


  if (error) {

    console.error(error);

    return;

  }


  if (!data || data.length === 0) {

    return;

  }


  await supabaseClient
    .from("products")
    .update({
      image_url: data[0].image_url,
      updated_at:
        new Date().toISOString()
    })
    .eq("id", productIdValue);

}


// =========================
// EDITAR PRODUTO
// =========================

async function editProduct(product) {

  productId.value =
    product.id;

  productName.value =
    product.name || "";

  productCategory.value =
    product.category || "Xbox";

  productDescription.value =
    product.description || "";

  productPrice.value =
    product.price || 0;

  productStock.value =
    product.stock || 0;

  productPromotion.checked =
    product.promotion === true;

  productActive.checked =
    product.active !== false;


  // Carregar fotos existentes
  const {
    data: images,
    error
  } = await supabaseClient
    .from("product_images")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", {
      ascending: true
    });


  if (!error) {

    existingImages =
      images || [];

  } else {

    existingImages = [];

  }


  selectedFiles = [];

  productImages.value = "";

  renderExistingImages();


  formTitle.textContent =
    "Editar produto";

  saveProductButton.textContent =
    "Atualizar produto";

  cancelEditButton.classList.remove(
    "hidden"
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// =========================
// MOSTRAR FOTOS EXISTENTES
// =========================

function renderExistingImages() {

  imagePreview.innerHTML = "";


  existingImages.forEach(image => {

    const wrapper =
      document.createElement("div");


    wrapper.style.position =
      "relative";

    wrapper.style.borderRadius =
      "12px";

    wrapper.style.overflow =
      "hidden";

    wrapper.style.border =
      "1px solid var(--border)";


    wrapper.innerHTML = `

      <img
        src="${escapeHTML(image.image_url)}"
        style="
          width:100%;
          height:110px;
          object-fit:cover;
          display:block;
        "
      >

      <button
        type="button"
        style="
          position:absolute;
          top:5px;
          right:5px;
          width:28px;
          height:28px;
          border-radius:50%;
          border:none;
          background:#35131b;
          color:#fff;
          cursor:pointer;
          font-weight:bold;
        "
      >
        ×
      </button>

    `;


    wrapper
      .querySelector("button")
      .addEventListener(
        "click",
        () => deleteImage(image)
      );


    imagePreview.appendChild(wrapper);

  });

}


// =========================
// EXCLUIR FOTO
// =========================

async function deleteImage(image) {

  const confirmed =
    confirm(
      "Deseja excluir esta foto?"
    );


  if (!confirmed) {
    return;
  }


  try {

    // Descobrir caminho da imagem
    const url =
      new URL(image.image_url);


    const marker =
      "/product-images/";


    const index =
      url.pathname.indexOf(marker);


    if (index !== -1) {

      const filePath =
        url.pathname
          .substring(
            index + marker.length
          );


      await supabaseClient.storage
        .from("product-images")
        .remove([filePath]);

    }


    // Remover do banco
    const { error } =
      await supabaseClient
        .from("product_images")
        .delete()
        .eq("id", image.id);


    if (error) {
      throw error;
    }


    existingImages =
      existingImages.filter(
        item => item.id !== image.id
      );


    renderExistingImages();


    // Atualizar foto principal
    await updateMainImage(
      productId.value
    );


  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível excluir a foto."
    );

  }

}


// =========================
// CANCELAR EDIÇÃO
// =========================

cancelEditButton.addEventListener(
  "click",
  () => {
    resetForm();
  }
);


function resetForm() {

  productId.value = "";

  productName.value = "";

  productCategory.value =
    "Xbox";

  productDescription.value =
    "";

  productPrice.value =
    "";

  productStock.value =
    "";

  productPromotion.checked =
    false;

  productActive.checked =
    true;


  productImages.value =
    "";

  selectedFiles = [];

  existingImages = [];

  imagePreview.innerHTML =
    "";


  formTitle.textContent =
    "Adicionar produto";

  saveProductButton.textContent =
    "Salvar produto";

  cancelEditButton.classList.add(
    "hidden"
  );

}


// =========================
// EXCLUIR PRODUTO
// =========================

async function deleteProduct(product) {

  const confirmed =
    confirm(
      `Tem certeza que deseja excluir "${product.name}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    // Buscar fotos
    const {
      data: images
    } = await supabaseClient
      .from("product_images")
      .select("*")
      .eq("product_id", product.id);


    // Remover arquivos do Storage
    if (images && images.length > 0) {

      const paths =
        images
          .map(image => {

            try {

              const url =
                new URL(
                  image.image_url
                );

              const marker =
                "/product-images/";

              const index =
                url.pathname.indexOf(
                  marker
                );

              if (index === -1) {
                return null;
              }

              return url.pathname.substring(
                index + marker.length
              );

            } catch {

              return null;

            }

          })
          .filter(Boolean);


      if (paths.length > 0) {

        await supabaseClient.storage
          .from("product-images")
          .remove(paths);

      }

    }


    // Excluir registros das fotos
    await supabaseClient
      .from("product_images")
      .delete()
      .eq("product_id", product.id);


    // Excluir produto
    const { error } =
      await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id);


    if (error) {
      throw error;
    }


    await loadAdminProducts();


  } catch (error) {

    console.error(error);

    alert(
      "Não foi possível excluir o produto."
    );

  }

}


// =========================
// SEGURANÇA DO HTML
// =========================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =========================
// ATUALIZAÇÃO AUTOMÁTICA
// =========================

supabaseClient
  .channel("admin-products")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "products"
    },
    () => {
      loadAdminProducts();
    }
  )
  .subscribe();


supabaseClient
  .channel("admin-product-images")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "product_images"
    },
    () => {
      loadAdminProducts();
    }
  )
  .subscribe();


// =========================
// INICIAR
// =========================

checkSession();