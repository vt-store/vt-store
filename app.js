const supabaseClient = window.supabase.createClient(
  window.VT_CONFIG.SUPABASE_URL,
  window.VT_CONFIG.SUPABASE_ANON_KEY
);


// ========================================
// ELEMENTOS
// ========================================

const productsGrid =
  document.getElementById("productsGrid");

const loading =
  document.getElementById("loading");

const emptyProducts =
  document.getElementById("emptyProducts");

const searchInput =
  document.getElementById("searchInput");

const productFilter =
  document.getElementById("productFilter");

const cartButton =
  document.getElementById("cartButton");

const cartCount =
  document.getElementById("cartCount");

const cartOverlay =
  document.getElementById("cartOverlay");

const closeCartButton =
  document.getElementById("closeCart");

const cartItems =
  document.getElementById("cartItems");

const emptyCart =
  document.getElementById("emptyCart");

const cartTotal =
  document.getElementById("cartTotal");

const checkoutButton =
  document.getElementById("checkoutButton");


// ========================================
// CONFIGURAÇÃO
// ========================================

const INFINITEPAY_CHECKOUT_URL =
  "https://knmwxyxgcgytzhggzhhd.supabase.co/functions/v1/create-checkout";


// ========================================
// VARIÁVEIS
// ========================================

let products = [];

let productImages = {};

let productVideos = {};

let selectedCategory = "Todos";

let selectedFilter = "todos";

let cart = [];


// ========================================
// CARRINHO
// ========================================

function loadCart() {

  try {

    const savedCart =
      localStorage.getItem("vt-store-cart");

    if (savedCart) {

      const parsedCart =
        JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {

        cart = parsedCart;

      }

    }

  } catch (error) {

    console.error(
      "Erro ao carregar carrinho:",
      error
    );

    cart = [];

  }

  updateCart();

}


function saveCart() {

  try {

    localStorage.setItem(
      "vt-store-cart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "Erro ao salvar carrinho:",
      error
    );

  }

}


// ========================================
// ADICIONAR AO CARRINHO
// ========================================

function addToCart(product) {

  if (!product) {
    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {

    alert(
      "Este produto está indisponível."
    );

    return;

  }

  const existingItem =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existingItem) {

    if (
      existingItem.quantity >=
      stock
    ) {

      alert(
        `Você já adicionou todas as ${stock} unidades disponíveis deste produto.`
      );

      return;

    }

    existingItem.quantity += 1;

  } else {

    const images =
      productImages[product.id] || [];

    const image =
      images.length > 0
        ? images[0]
        : product.image_url || "";


    cart.push({

      id: product.id,

      name: product.name,

      price:
        Number(product.price || 0),

      stock: stock,

      quantity: 1,

      image: image,

      category:
        product.category || ""

    });

  }


  saveCart();

  updateCart();

  openCart();

}


// ========================================
// REMOVER
// ========================================

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(productId)
    );

  saveCart();

  updateCart();

}


// ========================================
// QUANTIDADE
// ========================================

function changeQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(productId)
    );

  if (!item) {
    return;
  }


  const newQuantity =
    item.quantity + change;


  if (newQuantity <= 0) {

    removeFromCart(productId);

    return;

  }


  if (newQuantity > item.stock) {

    alert(
      `Apenas ${item.stock} unidade(s) disponível(is) em estoque.`
    );

    return;

  }


  item.quantity =
    newQuantity;

  saveCart();

  updateCart();

}


// ========================================
// ATUALIZAR CARRINHO
// ========================================

function updateCart() {

  renderCart();

  updateCartCount();

  updateCartTotal();

}


// ========================================
// CONTADOR
// ========================================

function updateCartCount() {

  const totalItems =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );


  if (cartCount) {

    cartCount.textContent =
      totalItems;

  }

}


// ========================================
// TOTAL
// ========================================

function getCartTotal() {

  return cart.reduce(
    (total, item) => {

      return (
        total +
        Number(item.price || 0) *
        Number(item.quantity || 0)
      );

    },
    0
  );

}


function updateCartTotal() {

  if (!cartTotal) {
    return;
  }


  cartTotal.textContent =
    formatCurrency(
      getCartTotal()
    );


  if (checkoutButton) {

    checkoutButton.disabled =
      cart.length === 0;

  }

}


// ========================================
// RENDERIZAR CARRINHO
// ========================================

function renderCart() {

  if (!cartItems || !emptyCart) {
    return;
  }


  cartItems.innerHTML = "";


  if (cart.length === 0) {

    emptyCart.classList.add(
      "active"
    );

    return;

  }


  emptyCart.classList.remove(
    "active"
  );


  cart.forEach(item => {

    const itemElement =
      document.createElement("div");

    itemElement.className =
      "cart-item";


    const imageHTML =
      item.image

        ? `
          <div class="cart-item-image">

            <img
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(item.name)}"
            >

          </div>
        `

        : `
          <div class="cart-item-image">

            <div class="no-image">
              📦
            </div>

          </div>
        `;


    itemElement.innerHTML = `

      ${imageHTML}

      <div class="cart-item-info">

        <h3>
          ${escapeHTML(item.name)}
        </h3>

        <div class="cart-item-price">
          ${formatCurrency(item.price)}
        </div>

        <div class="cart-item-actions">

          <div class="cart-quantity">

            <button
              type="button"
              class="cart-decrease"
              data-id="${escapeHTML(item.id)}"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              type="button"
              class="cart-increase"
              data-id="${escapeHTML(item.id)}"
            >
              +
            </button>

          </div>

          <button
            type="button"
            class="cart-remove"
            data-id="${escapeHTML(item.id)}"
          >
            Remover
          </button>

        </div>

      </div>

    `;


    cartItems.appendChild(
      itemElement
    );

  });


  cartItems
    .querySelectorAll(".cart-decrease")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            button.dataset.id,
            -1
          );

        }
      );

    });


  cartItems
    .querySelectorAll(".cart-increase")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            button.dataset.id,
            1
          );

        }
      );

    });


  cartItems
    .querySelectorAll(".cart-remove")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          removeFromCart(
            button.dataset.id
          );

        }
      );

    });

}


// ========================================
// ABRIR CARRINHO
// ========================================

function openCart() {

  if (!cartOverlay) {
    return;
  }

  cartOverlay.classList.add(
    "active"
  );

  document.body.style.overflow =
    "hidden";

}


// ========================================
// FECHAR CARRINHO
// ========================================

function closeCart() {

  if (!cartOverlay) {
    return;
  }

  cartOverlay.classList.remove(
    "active"
  );

  document.body.style.overflow =
    "";

}


// ========================================
// EVENTOS CARRINHO
// ========================================

if (cartButton) {

  cartButton.addEventListener(
    "click",
    openCart
  );

}


if (closeCartButton) {

  closeCartButton.addEventListener(
    "click",
    closeCart
  );

}


if (cartOverlay) {

  cartOverlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        cartOverlay
      ) {

        closeCart();

      }

    }
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeCart();

    }

  }
);


// ========================================
// FINALIZAR COMPRA
// ========================================

if (checkoutButton) {

  checkoutButton.addEventListener(
    "click",
    async () => {

      if (cart.length === 0) {

        alert(
          "Seu carrinho está vazio."
        );

        return;

      }


      try {

        checkoutButton.disabled =
          true;

        checkoutButton.textContent =
          "Gerando pagamento...";


        const response =
          await fetch(
            INFINITEPAY_CHECKOUT_URL,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "apikey":
                  window.VT_CONFIG
                    .SUPABASE_ANON_KEY,

                "Authorization":
                  `Bearer ${
                    window.VT_CONFIG
                      .SUPABASE_ANON_KEY
                  }`

              },

              body:
                JSON.stringify({

                  items:

                    cart.map(
                      item => ({

                        id:
                          item.id,

                        name:
                          item.name,

                        price:
                          Number(
                            item.price
                          ),

                        quantity:
                          Number(
                            item.quantity
                          )

                      })
                    )

                })

            }
          );


        const result =
          await response.json();


        console.log(
          "Resposta do checkout:",
          result
        );


        if (!response.ok) {

          console.error(
            "Erro retornado:",
            result
          );

          throw new Error(
            result.message ||
            result.error ||
            result.details ||
            "Não foi possível criar o pagamento."
          );

        }


        const checkoutUrl =
          result.checkout?.url ||
          result.checkout?.link ||
          result.checkout_url ||
          result.url ||
          result.link;


        if (!checkoutUrl) {

          console.error(
            "Resposta completa:",
            result
          );

          throw new Error(
            "A InfinitePay não retornou o link de pagamento."
          );

        }


        console.log(
          "Link InfinitePay:",
          checkoutUrl
        );


        window.location.href =
          checkoutUrl;

      } catch (error) {

        console.error(
          "Erro no checkout:",
          error
        );


        alert(
          error.message ||
          "Erro ao iniciar o pagamento."
        );


        checkoutButton.disabled =
          false;

        checkoutButton.textContent =
          "Finalizar compra";

      }

    }
  );

}


// ========================================
// CARREGAR PRODUTOS
// ========================================

async function loadProducts() {

  loading.style.display =
    "block";

  productsGrid.innerHTML =
    "";

  emptyProducts.style.display =
    "none";


  const {
    data,
    error
  } =
    await supabaseClient

      .from("products")

      .select("*")

      .eq(
        "active",
        true
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );

    loading.style.display =
      "none";


    productsGrid.innerHTML = `

      <div class="empty-products">

        <h3>
          Não foi possível carregar os produtos.
        </h3>

        <p>
          Verifique a conexão com o Supabase.
        </p>

      </div>

    `;

    return;

  }


  products =
    data || [];


  await loadAllProductMedia();


  loading.style.display =
    "none";


  renderProducts();

}


// ========================================
// CARREGAR FOTOS E VÍDEOS
// ========================================

async function loadAllProductMedia() {

  productImages = {};

  productVideos = {};


  if (!products.length) {
    return;
  }


  const productIds =
    products.map(
      product =>
        product.id
    );


  // ======================================
  // FOTOS
  // ======================================

  const {
    data: imagesData,
    error: imagesError
  } =
    await supabaseClient

      .from("product_images")

      .select("*")

      .in(
        "product_id",
        productIds
      )

      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (imagesError) {

    console.error(
      "Erro ao carregar fotos:",
      imagesError
    );

  }


  (imagesData || []).forEach(
    image => {

      if (
        !productImages[
          image.product_id
        ]
      ) {

        productImages[
          image.product_id
        ] = [];

      }


      productImages[
        image.product_id
      ].push(
        image.image_url
      );

    }
  );


  // ======================================
  // VÍDEOS
  // ======================================

  const {
    data: videosData,
    error: videosError
  } =
    await supabaseClient

      .from("product_videos")

      .select("*")

      .in(
        "product_id",
        productIds
      )

      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (videosError) {

    console.error(
      "Erro ao carregar vídeos:",
      videosError
    );

  }


  (videosData || []).forEach(
    video => {

      if (
        !productVideos[
          video.product_id
        ]
      ) {

        productVideos[
          video.product_id
        ] = [];

      }


      productVideos[
        video.product_id
      ].push(
        video.video_url
      );

    }
  );

}


// ========================================
// RENDERIZAR PRODUTOS
// ========================================

function renderProducts() {

  const search =
    searchInput

      ? searchInput.value
          .toLowerCase()
          .trim()

      : "";


  let filteredProducts =
    products.filter(
      product => {

        const matchesCategory =
          selectedCategory ===
            "Todos" ||
          product.category ===
            selectedCategory;


        const text = `

          ${product.name}

          ${product.category}

          ${product.description || ""}

        `.toLowerCase();


        const matchesSearch =
          text.includes(search);


        // ==================================
        // FILTRO DE ESTOQUE
        // ==================================

        const stock =
          Number(product.stock || 0);


        let matchesFilter = true;


        if (
          selectedFilter ===
          "disponivel"
        ) {

          matchesFilter =
            stock > 0;

        }


        if (
          selectedFilter ===
          "indisponivel"
        ) {

          matchesFilter =
            stock <= 0;

        }


        return (
          matchesCategory &&
          matchesSearch &&
          matchesFilter
        );

      }
    );


  // ========================================
  // ORDENAÇÃO POR PREÇO
  // ========================================

  if (
    selectedFilter ===
    "menor-preco"
  ) {

    filteredProducts.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  }


  if (
    selectedFilter ===
    "maior-preco"
  ) {

    filteredProducts.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  }


  productsGrid.innerHTML =
    "";


  if (
    filteredProducts.length === 0
  ) {

    emptyProducts.style.display =
      "block";

    return;

  }


  emptyProducts.style.display =
    "none";


  filteredProducts.forEach(
    product => {

      const card =
        createProductCard(
          product
        );


      productsGrid.appendChild(
        card
      );

    }
  );

}


// ========================================
// CRIAR CARD
// ========================================

function createProductCard(
  product
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "product-card";


  const price =
    Number(
      product.price || 0
    ).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );


  let images =
    productImages[
      product.id
    ] || [];


  if (
    images.length === 0 &&
    product.image_url
  ) {

    images = [
      product.image_url
    ];

  }


  const videos =
    productVideos[
      product.id
    ] || [];


  const mediaCount =
    images.length +
    videos.length;


  let imageHTML = `

    <div class="no-image">

      Foto do produto

      <br>

      <small>
        Disponível em breve
      </small>

    </div>

  `;


  if (images.length > 0) {

    imageHTML = `

      <div
        class="product-gallery-trigger"
        data-product-id="${escapeHTML(product.id)}"
      >

        <img
          src="${escapeHTML(images[0])}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
        >

        ${
          mediaCount > 1
            ? `

              <span class="photo-count">

                📷 ${images.length}

                ${
                  videos.length > 0
                    ? ` · 🎥 ${videos.length}`
                    : ""
                }

              </span>

            `
            : ""
        }

      </div>

    `;

  } else if (videos.length > 0) {

    imageHTML = `

      <div
        class="product-gallery-trigger product-video-cover"
        data-product-id="${escapeHTML(product.id)}"
      >

        <video
          src="${escapeHTML(videos[0])}"
          muted
          playsinline
          preload="metadata"
        ></video>

        <span class="video-cover-icon">
          ▶
        </span>

        ${
          mediaCount > 1
            ? `

              <span class="photo-count">

                🎥 ${videos.length}

              </span>

            `
            : ""
        }

      </div>

    `;

  }


  const promotionBadge =
    product.promotion

      ? `

        <span class="promotion-badge">
          OFERTA
        </span>

      `

      : "";


  const stock =
    Number(
      product.stock || 0
    );


  let stockText = "";


  if (stock > 0) {

    stockText =
      stock === 1
        ? "Última unidade disponível"
        : `${stock} unidades disponíveis`;

  } else {

    stockText =
      "Produto indisponível";

  }


  const whatsappMessage =
    encodeURIComponent(
      `Olá! Tenho interesse no produto: ${product.name}. Gostaria de saber mais informações.`
    );


  const whatsappLink =
    `https://wa.me/${window.VT_CONFIG.WHATSAPP}?text=${whatsappMessage}`;


  let buttonsHTML = "";


  if (stock > 0) {

    buttonsHTML = `

      <button
        type="button"
        class="product-cart-button"
        data-product-id="${escapeHTML(product.id)}"
      >
        🛒 Adicionar ao carrinho
      </button>

      <a
        href="${whatsappLink}"
        target="_blank"
        rel="noopener noreferrer"
        class="product-whatsapp"
      >
        Comprar pelo WhatsApp
      </a>

    `;

  } else {

    buttonsHTML = `

      <div
        class="product-whatsapp"
        style="opacity:0.45; cursor:not-allowed;"
      >
        Produto indisponível
      </div>

    `;

  }


  card.innerHTML = `

    <div class="product-image">

      ${imageHTML}

      ${promotionBadge}

    </div>


    <div class="product-info">

      <div class="product-category">

        ${escapeHTML(
          product.category
        )}

      </div>


      <h3 class="product-name">

        ${escapeHTML(
          product.name
        )}

      </h3>


      <p class="product-description">

        ${escapeHTML(
          product.description ||
          "Produto disponível na VT Store."
        )}

      </p>


      <div class="product-price">

        ${price}

      </div>


      <div class="product-stock">

        ${stockText}

      </div>


      ${buttonsHTML}

    </div>

  `;


  const galleryTrigger =
    card.querySelector(
      ".product-gallery-trigger"
    );


  if (
    galleryTrigger &&
    mediaCount > 0
  ) {

    galleryTrigger.addEventListener(
      "click",
      () => {

        openGallery(
          product,
          images,
          videos
        );

      }
    );

  }


  const cartProductButton =
    card.querySelector(
      ".product-cart-button"
    );


  if (cartProductButton) {

    cartProductButton.addEventListener(
      "click",
      () => {

        addToCart(
          product
        );

      }
    );

  }


  return card;

}


// ========================================
// GALERIA FOTO + VÍDEO
// ========================================

function openGallery(
  product,
  images,
  videos
) {

  closeGallery();


  const media = [];


  images.forEach(
    image => {

      media.push({
        type: "image",
        url: image
      });

    }
  );


  videos.forEach(
    video => {

      media.push({
        type: "video",
        url: video
      });

    }
  );


  if (!media.length) {
    return;
  }


  let currentIndex = 0;


  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "gallery-overlay";


  overlay.innerHTML = `

    <div class="gallery-modal">

      <button
        class="gallery-close"
        type="button"
      >
        ×
      </button>


      <div class="gallery-title">

        ${escapeHTML(
          product.name
        )}

      </div>


      <div class="gallery-main">

        ${
          media.length > 1
            ? `

              <button
                class="gallery-arrow gallery-prev"
                type="button"
              >
                ‹
              </button>

            `
            : ""
        }


        <div
          class="gallery-media-container"
        ></div>


        ${
          media.length > 1
            ? `

              <button
                class="gallery-arrow gallery-next"
                type="button"
              >
                ›
              </button>

            `
            : ""
        }

      </div>


      <div class="gallery-counter">

        1 / ${media.length}

      </div>


      ${
        media.length > 1
          ? `

            <div class="gallery-thumbnails">

              ${media
                .map(
                  (
                    item,
                    index
                  ) => {

                    if (
                      item.type ===
                      "video"
                    ) {

                      return `

                        <button
                          type="button"
                          class="gallery-thumbnail ${
                            index === 0
                              ? "active"
                              : ""
                          }"
                          data-index="${index}"
                        >

                          <div class="video-thumbnail">

                            <span>
                              ▶
                            </span>

                          </div>

                        </button>

                      `;

                    }


                    return `

                      <button
                        type="button"
                        class="gallery-thumbnail ${
                          index === 0
                            ? "active"
                            : ""
                        }"
                        data-index="${index}"
                      >

                        <img
                          src="${escapeHTML(item.url)}"
                          alt="Foto ${index + 1}"
                        >

                      </button>

                    `;

                  }
                )
                .join("")}

            </div>

          `
          : ""
      }

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  const mediaContainer =
    overlay.querySelector(
      ".gallery-media-container"
    );


  const counter =
    overlay.querySelector(
      ".gallery-counter"
    );


  const thumbnails =
    overlay.querySelectorAll(
      ".gallery-thumbnail"
    );


  function showMedia(index) {

    if (index < 0) {

      index =
        media.length - 1;

    }


    if (
      index >= media.length
    ) {

      index = 0;

    }


    currentIndex =
      index;


    const item =
      media[currentIndex];


    mediaContainer.innerHTML =
      "";


    if (
      item.type ===
      "video"
    ) {

      const video =
        document.createElement(
          "video"
        );


      video.className =
        "gallery-main-video";


      video.src =
        item.url;


      video.controls =
        true;


      video.autoplay =
        true;


      video.playsInline =
        true;


      video.preload =
        "metadata";


      mediaContainer.appendChild(
        video
      );

    } else {

      const image =
        document.createElement(
          "img"
        );


      image.className =
        "gallery-main-image";


      image.src =
        item.url;


      image.alt =
        `${product.name} - Foto ${currentIndex + 1}`;


      mediaContainer.appendChild(
        image
      );

    }


    counter.textContent =
      `${currentIndex + 1} / ${media.length}`;


    thumbnails.forEach(
      (
        thumbnail,
        i
      ) => {

        thumbnail.classList.toggle(
          "active",
          i === currentIndex
        );

      }
    );

  }


  const closeButton =
    overlay.querySelector(
      ".gallery-close"
    );


  closeButton.addEventListener(
    "click",
    closeGallery
  );


  const prevButton =
    overlay.querySelector(
      ".gallery-prev"
    );


  if (prevButton) {

    prevButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        showMedia(
          currentIndex - 1
        );

      }
    );

  }


  const nextButton =
    overlay.querySelector(
      ".gallery-next"
    );


  if (nextButton) {

    nextButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        showMedia(
          currentIndex + 1
        );

      }
    );

  }


  thumbnails.forEach(
    thumbnail => {

      thumbnail.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          showMedia(
            Number(
              thumbnail.dataset.index
            )
          );

        }
      );

    }
  );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        closeGallery();

      }

    }
  );


  function keyboardNavigation(
    event
  ) {

    if (
      !document.body.contains(
        overlay
      )
    ) {

      return;

    }


    if (
      event.key === "Escape"
    ) {

      closeGallery();

    }


    if (
      event.key === "ArrowLeft"
    ) {

      showMedia(
        currentIndex - 1
      );

    }


    if (
      event.key === "ArrowRight"
    ) {

      showMedia(
        currentIndex + 1
      );

    }

  }


  document.addEventListener(
    "keydown",
    keyboardNavigation
  );


  overlay._keyboardNavigation =
    keyboardNavigation;


  showMedia(0);

}


// ========================================
// FECHAR GALERIA
// ========================================

function closeGallery() {

  const gallery =
    document.querySelector(
      ".gallery-overlay"
    );


  if (!gallery) {
    return;
  }


  if (
    gallery._keyboardNavigation
  ) {

    document.removeEventListener(
      "keydown",
      gallery._keyboardNavigation
    );

  }


  gallery.remove();

}


// ========================================
// ESCAPAR HTML
// ========================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ========================================
// MOEDA
// ========================================

function formatCurrency(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


// ========================================
// PESQUISA
// ========================================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    () => {

      renderProducts();

    }
  );

}


// ========================================
// FILTRO DE PRODUTOS
// ========================================

if (productFilter) {

  productFilter.addEventListener(
    "change",
    () => {

      selectedFilter =
        productFilter.value ||
        "todos";

      renderProducts();

    }
  );

}


// ========================================
// CATEGORIAS
// ========================================

const categoryButtons =
  document.querySelectorAll(
    ".category-card"
  );


categoryButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          button.dataset.category ||
          "Todos";


        const produtos =
          document.getElementById(
            "produtos"
          );


        if (produtos) {

          produtos.scrollIntoView({
            behavior: "smooth"
          });

        }


        renderProducts();

      }
    );

  }
);


// ========================================
// REALTIME - PRODUTOS
// ========================================

supabaseClient

  .channel(
    "products-realtime"
  )

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "products"
    },
    () => {

      loadProducts();

    }
  )

  .subscribe();


// ========================================
// REALTIME - FOTOS
// ========================================

supabaseClient

  .channel(
    "product-images-realtime"
  )

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "product_images"
    },
    () => {

      loadProducts();

    }
  )

  .subscribe();


// ========================================
// REALTIME - VÍDEOS
// ========================================

supabaseClient

  .channel(
    "product-videos-realtime"
  )

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "product_videos"
    },
    () => {

      loadProducts();

    }
  )

  .subscribe();


// ========================================
// ESTILO EXTRA DA GALERIA DE VÍDEOS
// ========================================

const videoGalleryStyle =
  document.createElement("style");

videoGalleryStyle.textContent = `

  .gallery-media-container {
    width: 100%;
    max-width: 900px;
    max-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 12px;
  }

  .gallery-main-image,
  .gallery-main-video {
    max-width: 100%;
    max-height: 70vh;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 12px;
  }

  .gallery-main-video {
    background: #000;
  }

  .video-thumbnail {
    width: 100%;
    height: 100%;
    min-height: 60px;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-thumbnail span {
    font-size: 25px;
    color: white;
  }

  .product-video-cover {
    position: relative;
    overflow: hidden;
  }

  .product-video-cover video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-cover-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 55px;
    height: 55px;
    border-radius: 50%;
    background: rgba(0,0,0,0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

`;

document.head.appendChild(
  videoGalleryStyle
);


// ========================================
// INICIAR
// ========================================

loadCart();

loadProducts();
