// node_modules/@wxn0brp/flanker-ui/dist/html.js
var proto = {
  html(v) {
    if (v !== undefined) {
      this.innerHTML = v;
      return this;
    } else {
      return this.innerHTML;
    }
  },
  v(v) {
    if (v !== undefined) {
      this.value = v;
      return this;
    } else {
      return this.value;
    }
  },
  on(event, fn) {
    this.addEventListener(event, fn);
    return this;
  },
  css(style, val = null) {
    if (typeof style === "string") {
      if (val !== null) {
        this.style[style] = val;
      } else {
        this.style.cssText = style;
      }
    } else {
      Object.assign(this.style, style);
    }
    return this;
  },
  attrib(att, arg = null) {
    if (arg !== null) {
      this.setAttribute(att, arg);
      return this;
    } else {
      return this.getAttribute(att) || "";
    }
  },
  clA(...arg) {
    this.classList.add(...arg);
    return this;
  },
  clR(...arg) {
    this.classList.remove(...arg);
    return this;
  },
  clT(className, force) {
    this.classList.toggle(className, force);
    return this;
  },
  animateFade(from, options = {}) {
    const { time = 200, cb } = options;
    const element = this;
    const targetOpacity = from === 0 ? 1 : 0;
    const startOpacity = Math.min(1, Math.max(0, from));
    const startTime = performance.now();
    element.style.opacity = startOpacity.toString();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / time, 1);
      const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      element.style.opacity = currentOpacity.toString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.opacity = targetOpacity.toString();
        cb?.();
      }
    }
    requestAnimationFrame(step);
    return this;
  },
  fadeIn(...args) {
    const opts = convert({
      display: "string",
      cb: "function",
      time: "number"
    }, args);
    let { display = "block" } = opts;
    this.css("display", display);
    this.animateFade(0, opts);
    this.fade = true;
    return this;
  },
  fadeOut(...args) {
    const opts = convert({
      cb: "function",
      time: "number"
    }, args);
    const time = opts.time ?? 300;
    opts.time = time;
    this.animateFade(1, {
      ...opts,
      cb: () => {
        this.css("display", "none");
        opts.cb?.();
      }
    });
    this.fade = false;
    return this;
  },
  async fadeInP(...args) {
    return new Promise((resolve) => {
      this.fadeIn(...args, () => resolve(this));
    });
  },
  async fadeOutP(...args) {
    return new Promise((resolve) => {
      this.fadeOut(...args, () => resolve(this));
    });
  },
  fade: true,
  fadeToggle() {
    this.fade ? this.fadeOut() : this.fadeIn();
    return this;
  },
  add(child) {
    this.appendChild(child);
    return this;
  },
  addUp(child) {
    this.insertBefore(child, this.firstChild);
    return this;
  },
  qs(selector, did = 0) {
    if (!!did)
      selector = `[data-id="${selector}"]`;
    return this.querySelector(selector);
  }
};
proto.qi = proto.qs;
function convert(opts, args) {
  const result = {};
  if (args.length === 0)
    return result;
  if (args.every((arg) => typeof arg === "object"))
    return Object.assign({}, ...args);
  for (const value of args) {
    for (const [key, expectedType] of Object.entries(opts)) {
      if (typeof value === expectedType) {
        result[key] = value;
        break;
      }
    }
  }
  return result;
}
Object.assign(HTMLElement.prototype, proto);
Object.assign(document, proto);
Object.assign(document.body, proto);
Object.assign(document.documentElement, proto);
window.qs = window.qi = proto.qs.bind(document);

// ../node_modules/@wxn0brp/vql-client/dist/index.js
var VConfig = {
  transport: defTransport,
  fetchImplementation: (input, init) => fetch(input, init),
  hooks: {},
  url: "/VQL"
};
async function fetchVQL(query, vars = {}, hookContext = {}, fetchOptions = {}) {
  const { transport, hooks } = VConfig;
  const start = Date.now();
  try {
    hookContext = Object.assign({}, VConfig.hookContext, vars, hookContext);
    hooks.onStart?.(query, hookContext);
    if (typeof query === "string" && Object.keys(vars).length) {
      query = {
        query,
        var: vars
      };
    }
    const res = await transport(query, fetchOptions);
    const duration = Date.now() - start;
    hooks.onEnd?.(query, duration, res, hookContext);
    if (res?.err) {
      const error = new Error(res.err);
      hooks.onError?.(query, error, res, hookContext);
      throw error;
    }
    if (res.result !== undefined)
      return res.result;
    return res;
  } catch (e) {
    hooks.onError?.(query, e, null, hookContext);
    throw e;
  }
}
async function defTransport(query, fetchOptions) {
  const headers = Object.assign({
    "Content-Type": "application/json"
  }, VConfig.headers, fetchOptions.headers);
  const body = Object.assign({}, VConfig.body, fetchOptions.body, {
    query
  });
  const queryConfig = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  if (fetchOptions.signal)
    queryConfig.signal = fetchOptions.signal;
  const res = await VConfig.fetchImplementation(VConfig.url, queryConfig);
  if (!res.ok)
    throw new Error(`VQL request failed: ${res.status}`);
  return await res.json();
}
var V = async (strings, ...values) => {
  const query = strings.map((str, i) => str.trim() + (values[i] !== undefined ? values[i] : "")).join(" ");
  return fetchVQL(query);
};
if (typeof window !== "undefined") {
  window.VQLClient = {
    fetchVQL,
    defTransport,
    VQL: V,
    cfg: VConfig
  };
}

// ../node_modules/@wxn0brp/zhiva-base-lib/src/front/api.ts
var urlParams = new URLSearchParams(window.location.search);
var token = urlParams.get("zhiva-secret");
function fetchApi(url, opts = {}, query = {}) {
  const urlObj = new URL("/zhiva-api/" + url, window.location.origin);
  Object.entries(query).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value.toString());
  });
  return fetch(urlObj, {
    ...opts,
    headers: {
      ...opts.headers,
      "x-zhiva-token": token
    }
  });
}
async function fetchApiJson(url, opts = {}, query = {}) {
  return await fetchApi(url, opts, query).then((res) => res.json());
}

// src/vql.ts
VConfig.url = "/zhiva-api/VQL";
VConfig.headers = {
  "x-zhiva-token": token
};

// src/mgl.ts
var mgl = {};
window.mgl = mgl;

// src/cards.ts
var allCardMap = {};
var loadPromise = null;
async function waitToLoadCards() {
  if (loadPromise)
    return await loadPromise;
  loadPromise = loadCards();
  await loadPromise;
}
async function loadCards() {
  const cards = await V`card card`;
  cards.forEach((card) => {
    allCardMap[card._id] = card;
  });
}

// src/ui/board/animations.ts
function animateAttack(attackerCard, defenderCard) {
  const attackerRect = attackerCard.getBoundingClientRect();
  const defenderRect = defenderCard.getBoundingClientRect();
  const deltaX = defenderRect.left - attackerRect.left;
  const deltaY = defenderRect.top - attackerRect.top;
  attackerCard.style.setProperty("--attack-x", `${deltaX / 4}px`);
  attackerCard.style.setProperty("--attack-y", `${deltaY / 4}px`);
  attackerCard.classList.add("attacking", "card-attack");
  setTimeout(() => {
    defenderCard.classList.add("card-damage");
    setTimeout(() => {
      defenderCard.classList.remove("card-damage");
    }, 500);
  }, 400);
  setTimeout(() => {
    attackerCard.classList.remove("attacking", "card-attack");
  }, 800);
}
function turnStartAnimation() {
  const el = this.element.qs(".rows");
  el.clA("turn-start");
  setTimeout(() => el.clR("turn-start"), 1000);
}

// ../node_modules/@wxn0brp/event-emitter/dist/index.js
class VEE {
  _events = {};
  on(event, listener) {
    const _event = event;
    if (!this._events[_event])
      this._events[_event] = [];
    this._events[_event].push(listener);
  }
  once(event, listener) {
    const onceListener = (...args) => {
      this.off(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
  }
  off(event, listener) {
    const _event = event;
    if (!this._events[_event])
      return;
    this._events[_event] = this._events[_event].filter((l) => l !== listener);
  }
  _emit(event, ...args) {
    const listeners = this._events[event];
    if (!listeners?.length)
      return;
    listeners.forEach((listener) => listener(...args));
  }
  emit(event, ...args) {
    this._emit(event, ...args);
    this._emit("*", event, ...args);
  }
  listenerCount(event) {
    return this._events[event]?.length || 0;
  }
}
var dist_default = VEE;

// ../node_modules/@wxn0brp/gloves-link-client/dist/index.js
class GlovesLinkClient {
  _ws;
  _ackIdCounter;
  _ackCallbacks;
  _handlers = new dist_default;
  _manuallyDisconnected = false;
  _messageQueue = [];
  _reconnectAttempts = 0;
  opts;
  url;
  connected = false;
  constructor(url, opts = {}) {
    this._ackIdCounter = 1;
    this._ackCallbacks = new Map;
    this.opts = {
      logs: false,
      token: null,
      autoConnect: true,
      statusPath: "/gloves-link/status",
      reConnect: true,
      reConnectInterval: 1000,
      maxReConnectAttempts: 5,
      reConnectBackoffFactor: 2,
      maxReConnectDelay: 15000,
      ...opts
    };
    this.url = new URL(url, typeof window !== "undefined" ? window.location.href.replace("http", "ws") : "ws://localhost");
    if (this.opts.token)
      this.url.searchParams.set("token", this.opts.token);
    if (this.opts.autoConnect)
      this.connect();
  }
  connect() {
    this._manuallyDisconnected = false;
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    this.url.searchParams.set("id", id);
    if (this.opts.connectionData)
      this.url.searchParams.set("data", JSON.stringify(this.opts.connectionData));
    this._ws = new WebSocket(this.url.href);
    this._ws.onopen = () => {
      this.connected = true;
      this._reconnectAttempts = 0;
      if (this.opts.logs)
        console.log("[ws] Connected");
      let msg;
      while (msg = this._messageQueue.shift()) {
        this._ws.send(msg);
      }
      this._handlersEmit("connect");
    };
    this._ws.onerror = (...err) => {
      if (this.opts.logs)
        console.warn("[ws] Error:", err);
      this._handlersEmit("error", ...err);
    };
    this._ws.onmessage = (_data) => {
      const raw = _data?.data?.toString() || _data?.toString() || "";
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        if (this.opts.logs)
          console.warn("[ws] Invalid JSON:", raw);
        return;
      }
      if ("ack" in msg) {
        const ackId = msg.ack;
        const ackCallback = this._ackCallbacks.get(ackId);
        if (ackCallback) {
          this._ackCallbacks.delete(ackId);
          ackCallback(...msg.data);
        }
        return;
      }
      const { evt, data, ackI } = msg;
      if (!evt || data && !Array.isArray(data))
        return;
      if (Array.isArray(ackI)) {
        for (let i = 0;i < ackI.length; i++) {
          const ackIndex = ackI[i];
          if (!data[ackIndex])
            break;
          const ackId = data[ackIndex];
          data[ackIndex] = (...res) => {
            this._ws.send(JSON.stringify({
              ack: ackId,
              data: res
            }));
          };
        }
      }
      this._handlersEmit(evt, ...data);
    };
    this._ws.onclose = async (event) => {
      this.connected = false;
      if (this.opts.logs)
        console.log("[ws] Disconnected", event);
      this._handlersEmit("disconnect", event);
      if (this._manuallyDisconnected || !this.opts.reConnect)
        return;
      if (event.code === 1006) {
        if (this.opts.logs)
          console.log("[ws] Connection closed by server");
        try {
          const canReconnect = await checkStatus(this, id);
          if (!canReconnect)
            return;
        } catch (e) {
          if (this.opts.logs)
            console.error("[ws] Status error", e);
        }
      }
      this._reconnectAttempts++;
      if (this._reconnectAttempts > this.opts.maxReConnectAttempts) {
        if (this.opts.logs)
          console.error(`[ws] Max reconnect attempts reached (${this.opts.maxReConnectAttempts})`);
        this._handlersEmit("reconnect_failed");
        return;
      }
      const expDelay = Math.min(this.opts.reConnectInterval * this.opts.reConnectBackoffFactor ** (this._reconnectAttempts - 1), this.opts.maxReConnectDelay);
      const jitter = 1 + Math.random() * 0.5;
      const delay = Math.max(expDelay * jitter, this.opts.reConnectInterval);
      if (this.opts.logs)
        console.log(`[ws] Reconnecting in ${delay.toFixed(0)}ms (attempt ${this._reconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, delay);
    };
  }
  on(event, listener) {
    this._handlers.on(event, listener);
  }
  once(event, listener) {
    this._handlers.once(event, listener);
  }
  emit(evt, ...args) {
    const ackI = args.map((data, i) => {
      if (typeof data === "function")
        return i;
    }).filter((i) => i !== undefined);
    for (let i = 0;i < ackI.length; i++) {
      const ackIndex = ackI[i];
      const ackId = this._ackIdCounter++;
      this._ackCallbacks.set(ackId, args[ackIndex]);
      args[ackIndex] = ackId;
    }
    const payload = JSON.stringify({
      evt,
      data: args || undefined,
      ackI: ackI.length ? ackI : undefined
    });
    if (this.connected && this._ws?.readyState === WebSocket.OPEN)
      this._ws.send(payload);
    else
      this._messageQueue.push(payload);
  }
  send(evt, ...args) {
    return this.emit(evt, ...args);
  }
  disconnect() {
    this._manuallyDisconnected = true;
    this._ws.close();
  }
  close() {
    this._ws.close();
  }
  _handlersEmit(evtName, ...args) {
    this._handlers.emit(evtName, ...args);
  }
}
async function checkStatus(client, id) {
  const statusURL = new URL(client.opts.statusPath, client.url.origin);
  statusURL.searchParams.set("id", id);
  statusURL.searchParams.set("path", client.url.pathname);
  const statusUrl = statusURL.toString().replace("ws", "http");
  const res = await fetch(statusUrl);
  if (!res.ok) {
    console.error("[ws] Status error", res.status);
    return true;
  }
  const data = await res.json();
  if (data.err) {
    if (client.opts.logs)
      console.log("[ws] Status error", data.msg);
    return true;
  }
  const status = data.status;
  if (client.opts.logs)
    console.log("[ws] Status", status);
  if (status.status === 401) {
    client._handlersEmit("connect_unauthorized", status.msg);
    return false;
  } else if (status.status === 403) {
    client._handlersEmit("connect_forbidden", status.msg);
    return false;
  } else if (status.status === 500) {
    client._handlersEmit("connect_serverError", status.msg);
    return false;
  }
  return true;
}

// src/ws.ts
var params = new URLSearchParams(window.location.search);
function mockApi() {
  const token2 = params.get("token");
  if (!token2) {
    const tk = prompt("Enter token");
    location.search = `?token=${tk}`;
  }
  return {
    err: false,
    data: {
      _id: token2,
      sessionToken: token2
    }
  };
}
var tokenRes = localStorage.getItem("dev") === "true" ? mockApi() : await fetchApiJson("token");
if (tokenRes.err === true) {
  alert(tokenRes.msg);
  throw new Error(tokenRes.msg);
}
var socketUrl = await fetchApiJson("config/socket").then((res) => res.url);
qs("#not-login").remove();
var user = tokenRes.data;
var socket = new GlovesLinkClient(socketUrl, {
  token: tokenRes.data.sessionToken,
  logs: true,
  reConnectInterval: 3000
});
mgl.socket = socket;

// src/ui/board/targeting.ts
var targeting = {
  active: false,
  cardId: "",
  cardPos: "",
  effectId: "",
  effectName: "",
  targetType: "enemy"
};
function updateTargetingUI() {
  const banner = qs("#targeting-banner");
  const text = qs("#targeting-text");
  if (targeting.active) {
    banner.style.display = "flex";
    const targetLabel = targeting.targetType === "enemy" ? "ENEMY" : targeting.targetType === "ally" ? "ALLY" : targeting.targetType.toUpperCase();
    text.textContent = `Select target for: ${targeting.effectName} (${targetLabel})`;
    if (targeting.targetType === "ally") {
      banner.classList.add("ally-targeting");
    } else {
      banner.classList.remove("ally-targeting");
    }
    boardsComp.forEach((board) => {
      board.element.querySelectorAll(".targeting-active").forEach((card) => {
        card.classList.remove("targeting-active", "enemy-target", "ally-target");
      });
    });
    const targetClass = targeting.targetType === "enemy" ? "enemy-target" : "ally-target";
    if (targeting.targetType === "enemy") {
      const opponentBoardIndex = gameState.myBoardIndex ^ 1;
      const opponentBoard = boardsComp.find((b) => b.index === opponentBoardIndex);
      if (opponentBoard) {
        opponentBoard.element.querySelectorAll("article:not(.empty)").forEach((card) => {
          card.classList.add("targeting-active", targetClass);
        });
      }
    } else if (targeting.targetType === "ally") {
      const myBoard = boardsComp.find((b) => b.index === gameState.myBoardIndex);
      if (myBoard) {
        myBoard.element.querySelectorAll("article:not(.empty)").forEach((card) => {
          card.classList.add("targeting-active", targetClass);
        });
      }
    }
  } else {
    banner.style.display = "none";
    banner.classList.remove("ally-targeting");
    boardsComp.forEach((board) => {
      board.element.querySelectorAll(".targeting-active").forEach((card) => {
        card.classList.remove("targeting-active", "enemy-target", "ally-target");
      });
    });
  }
}
function startTargeting(cardId, cardPos, effectId, effectName, targetType) {
  targeting = {
    active: true,
    cardId,
    cardPos,
    effectId,
    effectName,
    targetType
  };
  updateTargetingUI();
}
function cancelTargeting() {
  targeting = {
    active: false,
    cardId: "",
    cardPos: "",
    effectId: "",
    effectName: "",
    targetType: "enemy"
  };
  updateTargetingUI();
}
function isTargeting() {
  return targeting.active;
}
function getTargetingState() {
  return { ...targeting };
}
function useEffectOnTarget(targetPos) {
  socket.emit("game.effect.use", `deck:${targeting.cardId}`, targeting.effectId, targetPos);
  cancelTargeting();
}
function setupTargetingEvents() {
  const cancelBtn = qs("#targeting-cancel");
  cancelBtn.addEventListener("click", () => {
    cancelTargeting();
  });
}

// src/ui/board/unused.ts
var unusedCards = qs("#unused-cards-container");
var unusedCardsOverlay = qs("#unused-cards-overlay");
var previousCardCount = -1;
function setCardsPosition() {
  const cards = Array.from(unusedCards.children);
  const overlayCards = Array.from(unusedCardsOverlay.children);
  for (let i = 0;i < cards.length; i++) {
    cards[i].style.top = `${overlayCards[i].offsetTop}px`;
    cards[i].style.left = `${overlayCards[i].offsetLeft}px`;
  }
}
window.addEventListener("resize", () => {
  if (previousCardCount <= 0)
    return;
  setCardsPosition();
});
function renderSpellEffects(card, cardId) {
  const abilityEffects = (card.effects || []).filter((effect) => effect.trigger === "ability");
  if (abilityEffects.length === 0)
    return "";
  const buttons = abilityEffects.map((effect) => {
    const targetType = card.targetScope || effect.operations?.find((op) => op.op === "resolve_target")?.target || "self";
    const targetLabel = targetType === "enemy" ? "Enemy" : targetType === "ally" ? "Ally" : "";
    const title = `${effect.name}
${effect.description || ""}${targetLabel ? `
Target: ` + targetLabel : ""}`;
    return `<button
class="spell-effect-btn"
data-card-id="${cardId}"
data-effect-id="${effect._id}"
data-target-type="${targetType}"
title="${title.replace(/"/g, "&quot;")}">
${effect.name}
</button>`;
  }).join("");
  return `<div class="card-spell-effects">${buttons}</div>`;
}
function renderUnusedCards(cards) {
  const isChanged = cards.length !== previousCardCount;
  if (!isChanged)
    return;
  previousCardCount = cards.length;
  const unusedIds = cards.map((card) => card._id);
  unusedCardsOverlay.innerHTML = "";
  for (const card of cards) {
    const div = document.createElement("article");
    div.setAttribute("data-card-id", card._id);
    unusedCardsOverlay.appendChild(div);
  }
  if (unusedCards.innerHTML) {
    Array.from(unusedCards.children).map((card) => {
      const cardId = card.getAttribute("data-card-id");
      if (!unusedIds.includes(cardId))
        card.remove();
    });
    setCardsPosition();
    return;
  }
  for (const card of cards) {
    const spellEffectsHtml = card.type === "spell" ? renderSpellEffects(card, card._id) : "";
    const div = document.createElement("article");
    div.innerHTML = `
<div class="card-content">
    <div class="card-header">
        <h3 class="card-name">${card.name}</h3>
    </div>
    <div class="card-body">
        <p class="card-class">${card.type}</p>
    </div>
    ${spellEffectsHtml}
</div>
`;
    div.title = JSON.stringify(card, null, 2);
    div.setAttribute("data-card-id", card._id);
    unusedCards.appendChild(div);
  }
  setCardsPosition();
}
function setupUnusedCardsEvents() {
  unusedCards.addEventListener("click", (e) => {
    const target = e.target;
    const effectBtn = target.closest(".spell-effect-btn");
    if (!effectBtn)
      return;
    e.stopPropagation();
    if (gameState.data.aggressive !== gameState.myBoardIndex)
      return console.error("Not your turn");
    const cardId = effectBtn.getAttribute("data-card-id");
    const effectId = effectBtn.getAttribute("data-effect-id");
    const targetType = effectBtn.getAttribute("data-target-type") || "enemy";
    if (targetType === "enemy")
      startTargeting(cardId, "", effectId, effectBtn.textContent, targetType);
    else
      socket.emit("game.effect.use", `deck:${cardId}`, effectId, "");
  });
}

// src/ui/board/events.ts
function events() {
  let activeUnusedCard;
  let selectedAttack;
  unusedCards.addEventListener("click", (e) => {
    if (this.index !== gameState.data.aggressive)
      return console.error("Not your turn");
    const target = e.target;
    const card = target.closest("article");
    if (!card)
      return;
    if (this.getBoardState().deploymentPoints <= 0)
      return console.error("No deployment points");
    if (activeUnusedCard === card) {
      card.classList.remove("active");
      this.element.classList.remove("active");
      activeUnusedCard = null;
      return;
    }
    unusedCards.querySelectorAll(".active").forEach((card2) => card2.classList.remove("active"));
    card.classList.add("active");
    activeUnusedCard = card;
    this.element.classList.add("active");
  });
  this.element.addEventListener("click", (e) => {
    const target = e.target;
    const effectBtn = target.closest(".effect-btn");
    if (effectBtn) {
      e.stopPropagation();
      if (this.index !== gameState.data.aggressive)
        return console.error("Not your turn");
      const cardId = effectBtn.getAttribute("data-card-id");
      const cardPos = effectBtn.getAttribute("data-card-pos");
      const effectId = effectBtn.getAttribute("data-effect-id");
      socket.emit("game.effect.use", `board:${cardPos}`, effectId, "");
      return;
    }
    if (this.index !== gameState.data.aggressive)
      return console.error("Not your turn");
    const card = target.closest("article");
    if (!card)
      return;
    if (activeUnusedCard) {
      if (!card.classList.contains("empty"))
        return console.error("Card not empty");
      const cardId = activeUnusedCard.getAttribute("data-card-id");
      const cardPosition = card.getAttribute("data-id");
      const cardData = allCardMap[cardId];
      const isRunesSlot = cardPosition.startsWith("runes-");
      if (isRunesSlot && cardData?.type !== "rune")
        return console.error("Only rune cards can be placed on runes slots");
      if (!isRunesSlot && cardData?.type !== "unit")
        return console.error("Only unit cards can be placed on non-runes slots");
      activeUnusedCard.classList.remove("active");
      activeUnusedCard = null;
      this.element.classList.remove("active");
      socket.emit("game.card.put", cardId, cardPosition);
      return;
    }
    if (!card.classList.contains("empty")) {
      const cardPos = card.getAttribute("data-id");
      if (cardPos?.startsWith("runes-"))
        return console.error("Runes cannot attack");
      if (selectedAttack === card) {
        card.classList.remove("selected");
        selectedAttack = null;
        this.element.classList.remove("active");
        return;
      }
      if (!gameState.data.phase)
        return console.error("Not in attack phase");
      this.element.querySelectorAll(".selected").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedAttack = card;
      this.element.classList.add("active");
      return;
    }
  });
  qs("#board_opponent").addEventListener("click", (e) => {
    const target = e.target;
    const card = target.closest("article");
    if (!card)
      return;
    if (isTargeting()) {
      const targetingState = getTargetingState();
      if (targetingState.targetType === "enemy" && !card.classList.contains("empty")) {
        const targetPos = card.getAttribute("data-id");
        useEffectOnTarget(targetPos);
        return;
      }
    }
    if (selectedAttack) {
      if (this.index !== gameState.data.aggressive)
        return console.error("Not your turn");
      const aggressiveCardPos = selectedAttack.getAttribute("data-id");
      const defensiveCardPos = card.getAttribute("data-id");
      if (defensiveCardPos?.startsWith("runes-"))
        return console.error("Runes cannot be attacked");
      const defensiveBoard = gameState.data.boards[1 - this.index];
      if (defensiveCardPos === "castle-1" && (defensiveBoard.cards.castle[0] || defensiveBoard.cards.castle[2]))
        return console.error("Cannot attack leader while guard is present");
      this.animateAttack(selectedAttack, card);
      selectedAttack.classList.remove("selected");
      selectedAttack = null;
      this.element.classList.remove("active");
      setTimeout(() => {
        socket.emit("game.attack.base", aggressiveCardPos, defensiveCardPos);
      }, 400);
      return;
    }
  });
  this.element.addEventListener("click", (e) => {
    if (!isTargeting())
      return;
    const targetingState = getTargetingState();
    if (targetingState.targetType !== "ally")
      return;
    const target = e.target;
    const card = target.closest("article");
    if (!card || card.classList.contains("empty"))
      return;
    e.stopPropagation();
    const targetPos = card.getAttribute("data-id");
    useEffectOnTarget(targetPos);
  });
}

// src/ui/board/render.ts
function render() {
  const boardState = this.getBoardState();
  const previousEp = this.ui.ep.innerHTML;
  const previousDp = this.ui.dp.innerHTML;
  this.ui.ep.innerHTML = boardState.essencePoints.toString();
  this.ui.dp.innerHTML = boardState.deploymentPoints.toString();
  const isAggressor = gameState.data.aggressive === this.index;
  const wasAggressor = this.ui.aggressor.innerHTML === "true";
  this.ui.aggressor.innerHTML = isAggressor ? "true" : "false";
  if (isAggressor && !wasAggressor)
    this.turnStartAnimation();
  this.ui.name.innerHTML = gameState.data.usersMeta[this.index].name;
  if (previousEp && previousEp !== this.ui.ep.innerHTML) {
    this.ui.ep.classList.add("energy-pulse");
    setTimeout(() => this.ui.ep.classList.remove("energy-pulse"), 1000);
  }
  if (previousDp && previousDp !== this.ui.dp.innerHTML) {
    this.ui.dp.classList.add("energy-pulse");
    setTimeout(() => this.ui.dp.classList.remove("energy-pulse"), 1000);
  }
  for (let i = 0;i < 5; i++) {
    this.renderCard(this.ui.ground.children[i], `ground-${i}`);
    this.renderCard(this.ui.castle.children[i], i === 0 || i === 4 ? "runes-" + Number(Boolean(i)) : "castle-" + (i - 1));
  }
}
function getCardElement(pos) {
  if (pos.startsWith("ground")) {
    const index = parseInt(pos.split("-")[1]);
    return this.ui.ground.children[index];
  } else {
    if (pos === "runes-0")
      return this.ui.castle.children[0];
    if (pos === "runes-1")
      return this.ui.castle.children[4];
    if (pos.startsWith("castle")) {
      const idx = parseInt(pos.split("-")[1]);
      return this.ui.castle.children[idx + 1];
    }
  }
  return null;
}
function renderCard(div, pos) {
  const boardState = this.getBoardState();
  const splitPos = pos.split("-");
  const cardId = boardState.cards[splitPos[0]][+splitPos[1]];
  const data = allCardMap[cardId];
  if (!data) {
    div.innerHTML = "Empty";
    div.classList.add("empty");
    div.classList.remove("card-deal");
    div.removeAttribute("data-card-id");
    return;
  }
  const state = boardState.cards.state[pos];
  div.classList.remove("empty");
  const previousCardId = div.getAttribute("data-card-id");
  const isNewCard = previousCardId !== cardId;
  const previousHp = div.querySelector(".card-hp")?.textContent;
  const currentHp = state.hp.toString();
  div.innerHTML = `
<div class="card-content">
    <div class="card-header">
        <h3 class="card-name">${data.name}</h3>
    </div>
    <div class="card-body">
        <p class="card-class">${data.class.join(", ")}</p>
    </div>
    <div class="card-footer">
        <span class="card-stat">HP: <strong class="card-hp">${state.hp}</strong></span>
    </div>
    ${this.renderEffects(data, cardId, pos)}
</div>
`;
  div.setAttribute("data-card-id", cardId);
  if (isNewCard) {
    div.classList.add("card-deal");
    setTimeout(() => {
      div.classList.remove("card-deal");
    }, 600);
  } else if (previousHp && previousHp !== currentHp) {
    const hpElement = div.querySelector(".card-hp");
    if (hpElement) {
      hpElement.classList.add("hp-change");
      setTimeout(() => {
        hpElement.classList.remove("hp-change");
      }, 400);
    }
    if (state.hp <= 0) {
      div.classList.add("card-destroy");
      setTimeout(() => {
        div.classList.remove("card-destroy");
      }, 500);
    }
  }
  div.oncontextmenu = (e) => {
    e.preventDefault();
    alert(JSON.stringify(Object.assign({}, { state }, { data }), null, 2));
  };
}
function renderEffects(data, cardId, pos) {
  const abilityEffects = (data.effects || []).filter((effect) => effect.trigger === "ability");
  if (abilityEffects.length === 0)
    return "";
  const buttons = abilityEffects.map((effect) => {
    const costText = "";
    const title = `${effect.name}${costText}
${effect.description || ""}`;
    return `<button class="effect-btn" data-card-id="${cardId}" data-card-pos="${pos}" data-effect-id="${effect._id}" title="${title.replace(/"/g, "&quot;")}">${effect.name}${costText}</button>`;
  }).join("");
  return `<div class="card-effects">${buttons}</div>`;
}

// src/ui/board/index.ts
class BoardUi {
  element;
  ui = {};
  index;
  constructor(element) {
    this.element = element;
    this.ui.ep = this.element.qs("ep", 1);
    this.ui.dp = this.element.qs("dp", 1);
    this.ui.aggressor = this.element.qs("aggressor", 1);
    this.ui.name = this.element.qs("name", 1);
    this.ui.ground = this.element.qs("ground", 1);
    this.ui.castle = this.element.qs("castle", 1);
  }
  mount() {}
  init(index) {
    this.index = index;
    this.render();
  }
  getBoardState() {
    return gameState.data.boards[this.index];
  }
  render = render;
  getCardElement = getCardElement;
  renderCard = renderCard;
  renderEffects = renderEffects;
  animateAttack = animateAttack;
  events = events;
  turnStartAnimation = turnStartAnimation;
}

// src/state.ts
var gameState = {
  data: null,
  myBoardIndex: null
};
var boards = document.querySelectorAll(".board");
var boardsComp = [
  new BoardUi(boards[0]),
  new BoardUi(boards[1])
];
mgl.state = gameState;

// src/keyboard/vars.ts
var $keyboard = {
  buffer: "",
  feedbackTimeout: null,
  history: [],
  historyIndex: -1,
  bufDiv: qs("#keyboard-buffer"),
  feedbackDiv: qs("#keyboard-feedback"),
  helpDiv: qs("#keyboard-help"),
  helpVisible: false,
  macros: {}
};
var zoneMap = {
  g: "ground",
  c: "castle",
  r: "runes"
};

// src/keyboard/utils.ts
function strToPos(zone, index) {
  return `${zone}-${index}`;
}
function validSlot(zone, index) {
  if (zone === "ground")
    return index >= 0 && index <= 4;
  if (zone === "castle")
    return index >= 0 && index <= 2;
  if (zone === "runes")
    return index >= 0 && index <= 1;
  return false;
}
function cardAt(boardIdx, zone, index) {
  const cards = gameState.data.boards[boardIdx].cards;
  if (zone === "ground")
    return cards.ground[index];
  if (zone === "castle")
    return cards.castle[index];
  if (zone === "runes")
    return cards.runes[index];
  return null;
}
function isMyTurn() {
  return gameState.data.aggressive === gameState.myBoardIndex;
}
function feedback(msg) {
  console.log("[Keyboard]", msg);
  clearTimeout($keyboard.feedbackTimeout);
  $keyboard.feedbackDiv.innerHTML = msg;
  $keyboard.feedbackDiv.fadeIn();
  $keyboard.feedbackTimeout = setTimeout(() => $keyboard.feedbackDiv.fadeOut(), 2500);
}
function showBuf() {
  $keyboard.bufDiv.innerHTML = $keyboard.buffer || "";
  $keyboard.bufDiv.clT("visible", !!$keyboard.buffer);
}
function clearBuf() {
  $keyboard.buffer = "";
  showBuf();
}

// src/keyboard/run.ts
function cmdDeploy(cardIdx, zone, slotIdx) {
  if (!isMyTurn())
    return console.error("Not your turn");
  const board = gameState.data.boards[gameState.myBoardIndex];
  if (board.deploymentPoints <= 0)
    return console.error("No deployment points");
  if (cardIdx < 0 || cardIdx >= board.cards.unused.length)
    return console.error(`Bad card index ${cardIdx}`);
  if (!validSlot(zone, slotIdx))
    return console.error("Bad slot");
  const pos = strToPos(zone, slotIdx);
  const mc = board.cards;
  if (zone === "ground" && mc.ground[slotIdx])
    return console.error(`${pos} occupied`);
  if (zone === "castle" && mc.castle[slotIdx])
    return console.error(`${pos} occupied`);
  if (zone === "runes" && mc.runes[slotIdx])
    return console.error(`${pos} occupied`);
  const cardId = board.cards.unused[cardIdx];
  const cardData = allCardMap[cardId];
  if (zone === "runes" && cardData?.type !== "rune")
    return console.error("Only rune cards can be placed on runes slots");
  if (zone !== "runes" && cardData?.type !== "unit")
    return console.error("Only unit cards can be placed on non-runes slots");
  feedback(`${cardIdx} -> ${pos}`);
  socket.emit("game.card.put", cardId, pos);
}
function cmdAttack(fromZone, fromIdx, toZone, toIdx) {
  if (!isMyTurn())
    return console.error("Not your turn");
  if (!gameState.data.phase)
    return console.error("Not in attack phase");
  const mi = gameState.myBoardIndex;
  const oi = 1 - mi;
  const fromPos = strToPos(fromZone, fromIdx);
  const toPos = strToPos(toZone, toIdx);
  if (!cardAt(mi, fromZone, fromIdx))
    return console.error(`No card at ${fromPos}`);
  if (!cardAt(oi, toZone, toIdx))
    return console.error(`No enemy at ${toPos}`);
  if (fromZone === "runes")
    return console.error("Runes cannot attack");
  if (toZone === "runes")
    return console.error("Runes cannot be attacked");
  const enemyBoard = gameState.data.boards[oi];
  if (toZone === "castle" && toIdx === 1 && (enemyBoard.cards.castle[0] || enemyBoard.cards.castle[2]))
    return console.error("Cannot attack leader while guard is present");
  const atk = boardsComp[mi].getCardElement(fromPos);
  const def = boardsComp[oi].getCardElement(toPos);
  if (atk && def)
    boardsComp[mi].animateAttack(atk, def);
  feedback(`${fromPos} -> ${toPos}`);
  socket.emit("game.attack.base", fromPos, toPos);
}
function cmdEffectUse(cardRef, effectId, target) {
  if (!isMyTurn())
    return console.error("Not your turn");
  feedback(`Effect ${effectId} -> ${target || "no target"}`);
  socket.emit("game.effect.use", cardRef, effectId, target);
}
function cmdEndTurn() {
  if (!isMyTurn())
    return console.error("Not your turn");
  feedback("End turn");
  socket.emit("game.turn.end");
}
function cmdNextPhase() {
  feedback("Next phase");
  socket.emit("game.phase.next");
}
function execMacro(name) {
  const macro = $keyboard.macros[name];
  if (!macro) {
    feedback(`Macro "${name}" not found`);
    return;
  }
  const [eventName, ...args] = macro;
  const fullEventName = `game.${eventName}`;
  feedback(`Macro: ${name}`);
  socket.emit(fullEventName, ...args);
}

// src/keyboard/exec.ts
function exec() {
  const { buffer } = $keyboard;
  if (!buffer)
    return;
  const mm = buffer.match(/^m\.(\w+)$/);
  if (mm) {
    execMacro(mm[1]);
    clearBuf();
    return;
  }
  if (buffer === "ee") {
    cmdEndTurn();
    clearBuf();
    return;
  }
  if (buffer === "nn") {
    cmdNextPhase();
    clearBuf();
    return;
  }
  const dm = buffer.match(/^d(\d+)([gcr])(\d+)$/);
  if (dm) {
    cmdDeploy(+dm[1], zoneMap[dm[2]], +dm[3]);
    clearBuf();
    return;
  }
  const am = buffer.match(/^a([gcr])(\d+)([gcr])(\d+)$/);
  if (am) {
    cmdAttack(zoneMap[am[1]], +am[2], zoneMap[am[3]], +am[4]);
    clearBuf();
    return;
  }
  const em = buffer.match(/^e([gcrg]?)(\d+)\.(\d+)([gcr]\d+)?$/);
  if (em) {
    const zone = zoneMap[em[1]] || null;
    const slotIdx = +em[2];
    const effectIdx = +em[3];
    const targetStr = em[4] || null;
    let cardRef;
    let effectId;
    let target = "";
    if (!zone || zone === "d") {
      const board = gameState.data.boards[gameState.myBoardIndex];
      const cardId = board.cards.unused[slotIdx];
      if (!cardId)
        return feedback("Deck card not found");
      cardRef = `deck:${cardId}`;
      const card = allCardMap[cardId];
      if (!card || !card.effects[effectIdx])
        return feedback("Effect not found");
      effectId = card.effects[effectIdx]._id;
    } else {
      const pos = strToPos(zone, slotIdx);
      cardRef = `board:${pos}`;
      const board = gameState.data.boards[gameState.myBoardIndex];
      const position = zone === "g" ? "ground" : zone === "c" ? "castle" : "runes";
      const cardId = board.cards[position][slotIdx];
      if (!cardId)
        return feedback("Card not found");
      const card = allCardMap[cardId];
      if (!card || !card.effects[effectIdx])
        return feedback("Effect not found");
      effectId = card.effects[effectIdx]._id;
    }
    if (targetStr) {
      const tZone = zoneMap[targetStr[0]];
      const tIdx = +targetStr.slice(1);
      if (!validSlot(tZone, tIdx))
        return feedback("Invalid target slot");
      target = strToPos(tZone, tIdx);
    }
    cmdEffectUse(cardRef, effectId, target);
    clearBuf();
    return;
  }
  feedback(`Unknown: ${buffer}`);
  clearBuf();
}

// src/keyboard/keydown.ts
function onKeyDown(e) {
  if (document.activeElement?.tagName === "INPUT")
    return;
  if (document.activeElement?.tagName === "TEXTAREA")
    return;
  const { history, helpDiv } = $keyboard;
  if ($keyboard.helpVisible) {
    if (e.key === "Escape" || e.key === "h") {
      e.preventDefault();
      helpDiv.fadeOut();
      $keyboard.helpVisible = false;
      return;
    }
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (history.length > 0) {
      if ($keyboard.historyIndex === -1) {
        $keyboard.historyIndex = history.length - 1;
      } else if ($keyboard.historyIndex > 0) {
        $keyboard.historyIndex--;
      }
      $keyboard.buffer = history[$keyboard.historyIndex];
      showBuf();
    }
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if ($keyboard.historyIndex !== -1) {
      if ($keyboard.historyIndex < history.length - 1) {
        $keyboard.historyIndex++;
        $keyboard.buffer = history[$keyboard.historyIndex];
      } else {
        $keyboard.historyIndex = -1;
        $keyboard.buffer = "";
      }
      showBuf();
    }
    return;
  }
  if (e.key === "Escape") {
    clearBuf();
    feedback("Cleared");
    return;
  }
  if (e.key === "h") {
    if (!$keyboard.buffer) {
      $keyboard.helpVisible = true;
      helpDiv.fadeIn();
    }
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    if ($keyboard.buffer) {
      history.push($keyboard.buffer);
      $keyboard.historyIndex = -1;
      exec();
    }
    return;
  }
  if (e.key === "Backspace") {
    $keyboard.buffer = $keyboard.buffer.slice(0, -1);
    showBuf();
    return;
  }
  const ch = e.key.toLowerCase();
  if (/^[a-z0-9]$/.test(ch) || ch === ".") {
    $keyboard.buffer += ch;
    showBuf();
  }
}

// src/keyboard/index.ts
function setMacro(name, ...args) {
  $keyboard.macros[name] = args;
  console.log(`[Macro] Set "${name}" to:`, args);
}
mgl.setMacro = setMacro;
function setupKeyboardEvents() {
  document.addEventListener("keydown", onKeyDown);
}

// src/ui/board/buttons.ts
var buttons = qs("#game-controls-buttons");
buttons.qs("end-turn", 1).addEventListener("click", async () => {
  if (gameState.myBoardIndex !== gameState.data.aggressive)
    return console.error("Not your turn");
  socket.emit("game.turn.end");
});
buttons.qs("next-phase", 1).addEventListener("click", async () => {
  if (gameState.data.phase)
    return;
  socket.emit("game.phase.next");
});

// src/loader.ts
var loader;
((loader) => {
  const div = qs("#loader");
  let i = 0;
  function increment() {
    div.style.display = "";
    i++;
  }
  loader.increment = increment;
  function decrement() {
    i--;
    if (i <= 0) {
      div.style.display = "none";
      i = 0;
    }
  }
  loader.decrement = decrement;
})(loader ||= {});

// src/ui/pages/cards.ts
var cardGrid = qs("#available-cards");
var deckCount = qs("#deck-count");
var selectedCards = new Set;
function updateDeckStatus() {
  deckCount.innerText = `Selected: ${selectedCards.size}/15`;
}
function renderCard2(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.setAttribute("data-id", card._id);
  const cost = "cost" in card ? card.cost : "";
  const hp = "health" in card ? card.health : "";
  let damage = "";
  if ("attack" in card) {
    damage = Math.max(card.attack.physical, card.attack.arts, card.attack.true).toString();
  }
  const cardClass = "class" in card ? card.class[0] : card.type;
  el.innerHTML = `
        <div class="card-content">
            <div class="card-header">
                <div class="card-name">${card.name}</div>
            </div>
            <div class="card-body">
                 <div class="card-class">${cardClass}</div>
            </div>
            <div class="card-footer">
                ${hp ? `<div class="card-stat hp">HP ${hp}</div>` : ""}
                ${damage ? `<div class="card-stat attack">DMG ${damage}</div>` : ""}
                ${cost !== "" ? `<div class="card-stat cost">C ${cost}</div>` : ""}
            </div>
        </div>
    `;
  el.addEventListener("click", () => {
    if (selectedCards.has(card._id)) {
      selectedCards.delete(card._id);
      el.classList.remove("selected");
    } else {
      if (selectedCards.size >= 15)
        return alert("Max 15 cards allowed!");
      selectedCards.add(card._id);
      el.classList.add("selected");
    }
    updateDeckStatus();
  });
  return el;
}
async function loadCards2() {
  loader.increment();
  const cards = await V`card card`;
  const deck = await V`client deck!`;
  loader.decrement();
  cardGrid.innerHTML = "";
  selectedCards.clear();
  cards.forEach((card) => {
    const el = renderCard2(card);
    if (deck && deck.cards.includes(card._id)) {
      selectedCards.add(card._id);
      el.classList.add("selected");
    }
    cardGrid.appendChild(el);
  });
  updateDeckStatus();
}

// src/searchGame.ts
function searchGame(type) {
  if (selectedCards.size === 0) {
    if (!confirm("You haven't selected any cards. A random deck will be used. Do you want to proceed?"))
      return;
  }
  setSearchButtonsDisabled(true);
  const deck = Array.from(selectedCards);
  socket.emit("game.search", deck, type, (data) => {
    if (data === true) {
      loader.increment();
      console.log("[EF-UI-01] Game searching...");
      infoContainer.search.style.display = "";
      infoContainer.searchName.innerHTML = type;
      infoContainer.searchErr.innerHTML = "";
    } else {
      console.error("[EF-UI-02] Game searching error:", data);
      infoContainer.searchErr.innerHTML = "Something went wrong...";
      if (typeof data === "string")
        alert(data);
    }
    setSearchButtonsDisabled(false);
  });
  fetchVQL({
    db: "client",
    d: {
      updateOneOrAdd: {
        collection: "deck",
        search: {},
        updater: {
          cards: deck
        }
      }
    }
  });
}

// src/ui/pages/buttons.ts
var searchGameContainer = qs("#pg_play__board");
var infoContainerDiv = qs("#pg_play__info");
var searchGameButtons = {
  normal: searchGameContainer.qs("normal", 1),
  ranked: searchGameContainer.qs("ranked", 1),
  story: searchGameContainer.qs("story", 1),
  training: searchGameContainer.qs("training", 1)
};
function setSearchButtonsDisabled(disabled) {
  Object.values(searchGameButtons).forEach((btn) => btn.disabled = disabled);
}
var infoContainer = {
  search: infoContainerDiv.qs("search", 1),
  searchName: infoContainerDiv.qs("search-name", 1),
  cancelMatch: infoContainerDiv.qs("cancel-match", 1),
  searchErr: infoContainerDiv.qs("search-err", 1)
};
searchGameButtons.normal.addEventListener("click", () => searchGame("normal"));
searchGameButtons.ranked.addEventListener("click", () => searchGame("ranked"));
infoContainer.cancelMatch.addEventListener("click", () => {
  socket.emit("match.cancel");
  infoContainer.search.style.display = "none";
  loader.decrement();
});

// src/ui/pages/index.ts
var pages = document.querySelectorAll("#view-main > div");
var switches = document.querySelectorAll("aside button");
function switchPage(page) {
  pages.forEach((page2) => page2.style.display = "none");
  switches.forEach((button) => button.classList.remove("active"));
  qs("#page-" + page).style.display = "";
  qs(page, 1).classList.add("active");
}
switches.forEach((button) => {
  button.addEventListener("click", () => {
    switchPage(button.dataset.id);
  });
});

// src/ui/main.ts
var matchProposalEl = qs("#match-proposal");
var matchAcceptBtn = qs("#match-accept");
var matchDeclineBtn = qs("#match-decline");
var userNameDiv = qs("#pg_profile__name");
function getUserInfo() {
  loader.increment();
  socket.emit("user.info", (data) => {
    userNameDiv.innerHTML = data.name;
    qs("#pg_profile__ep_rank").innerHTML = data.rank;
    qs("#pg_profile__ep_bar").title = data.lp.toString() + " / 100";
    qs("#pg_profile__ep_bar_fill").style.setProperty("--ep-percent", `${data.lp / 100 * 100}%`);
    loader.decrement();
  });
}
socket.on("match.proposal", (data) => {
  matchProposalEl.style.display = "flex";
  matchProposalEl.classList.add("visible");
});
matchAcceptBtn.addEventListener("click", () => {
  socket.emit("match.proposal.respond", true);
  matchProposalEl.style.display = "none";
  matchProposalEl.classList.remove("visible");
});
matchDeclineBtn.addEventListener("click", () => {
  socket.emit("match.proposal.respond", false);
  matchProposalEl.style.display = "none";
  matchProposalEl.classList.remove("visible");
});
userNameDiv.addEventListener("dblclick", () => {
  const lastName = userNameDiv.innerHTML;
  const input = document.createElement("input");
  userNameDiv.innerHTML = "";
  userNameDiv.appendChild(input);
  input.value = lastName;
  input.focus();
  let block = false;
  function save() {
    if (block)
      return;
    block = true;
    const affirmation = confirm("Save changes?");
    userNameDiv.innerHTML = affirmation ? input.value : lastName;
    if (!affirmation)
      return;
    socket.emit("user.meta.name.set", input.value);
  }
  input.addEventListener("blur", () => save());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      save();
  });
});

// src/bot.ts
class Bot {
  running = false;
  executeMove(move) {
    switch (move.type) {
      case "deploy":
        socket.emit("game.card.put", move.who, move.to);
        break;
      case "attack":
        socket.emit("game.attack.base", move.who, move.to);
        break;
      case "effect":
        socket.emit("game.effect.use", move.who, move.effectId, move.targets?.[0] ?? "");
        break;
      case "end_turn":
        socket.emit("game.turn.end");
        break;
      case "next_phase":
        socket.emit("game.phase.next");
        break;
    }
  }
  async run(one = false) {
    if (this.running)
      return;
    this.running = true;
    const end = () => this.running = false;
    while (this.running) {
      const moves = await new Promise((resolve) => socket.emit("game.moves", (data) => resolve(data)));
      if (!moves.length)
        return end();
      const firstMove = moves[0];
      console.log("Executing move:", firstMove);
      this.executeMove(firstMove);
      if (one)
        return end();
      if (firstMove.type === "end_turn")
        return end();
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  stop() {
    this.running = false;
  }
}
var bot = new Bot;
mgl.bot = bot;

// src/ui/notifications.ts
var notificationOverlay = qs("#game-notification");
var notificationTitle = qs("#notification-title");
var notificationMessage = qs("#notification-message");
var notificationClose = qs("#notification-close");
var turnBanner = qs("#turn-banner");
var onCloseCallback = null;
function showNotification(title, message, type = "info", onClose) {
  if (!notificationOverlay || !notificationTitle || !notificationMessage)
    return;
  onCloseCallback = onClose || null;
  notificationTitle.innerText = title;
  notificationMessage.innerText = message;
  notificationTitle.className = "";
  if (type !== "info") {
    notificationTitle.classList.add(type);
  }
  notificationOverlay.classList.remove("hidden");
  notificationOverlay.style.display = "flex";
  notificationOverlay.offsetWidth;
  notificationOverlay.classList.add("visible");
}
function hideNotification() {
  if (!notificationOverlay)
    return;
  notificationOverlay.classList.remove("visible");
  setTimeout(() => {
    notificationOverlay.style.display = "none";
    if (onCloseCallback) {
      onCloseCallback();
      onCloseCallback = null;
    }
  }, 500);
}
notificationClose.addEventListener("click", hideNotification);

// src/wsEvt.ts
socket.on("error", (...args) => {
  console.error("error", ...args);
});
socket.on("error.valid", (...args) => {
  console.error("error.valid", ...args);
});
socket.on("error.spam", (...args) => {
  console.error("error.spam", ...args);
});
socket.on("game.start", () => {
  qs("#view-main").style.display = "none";
  qs("#view-game").style.display = "";
  infoContainer.search.style.display = "none";
  loader.decrement();
  setSearchButtonsDisabled(false);
});
socket.on("game.win", (winner) => {
  const isWin = gameState.myBoardIndex === winner;
  showNotification(isWin ? "VICTORY" : "DEFEAT", isWin ? "You have defeated your opponent!" : "You have been defeated!", isWin ? "victory" : "defeat", () => {
    qs("#view-main").style.display = "";
    qs("#view-game").style.display = "none";
  });
});
socket.on("game.attack", (attackerIndex, aPos, dPos) => {
  const isMeAttacker = attackerIndex === gameState.myBoardIndex;
  if (isMeAttacker)
    return;
  const attackerBoard = isMeAttacker ? boardsComp[1] : boardsComp[0];
  const defenderBoard = isMeAttacker ? boardsComp[0] : boardsComp[1];
  const attEl = attackerBoard.getCardElement(aPos);
  const defEl = defenderBoard.getCardElement(dPos);
  if (attEl && defEl) {
    attackerBoard.animateAttack(attEl, defEl);
  }
});
socket.on("game.start", async (startState, state) => {
  console.log("start", startState, state);
  gameState.data = state;
  window.state = gameState.data;
  gameState.myBoardIndex = Number(user._id === state.users[1]);
  await waitToLoadCards();
  boardsComp[0].init(gameState.myBoardIndex ^ 1);
  boardsComp[1].init(gameState.myBoardIndex);
});
socket.on("game.state", async (state) => {
  await waitToLoadCards();
  Object.assign(gameState.data, state);
  boardsComp[0].render();
  boardsComp[1].render();
  renderUnusedCards(state.boards[gameState.myBoardIndex].cards.unused.map((id) => allCardMap[id]));
  qs(`#game-controls-buttons`).qs("next-phase-count", 1).innerHTML = state.phaseMeta.length.toString();
});
if (localStorage.getItem("dev") === "true") {
  socket.on("disconnect", () => {
    if (qs("#view-game").style.display === "none")
      return;
    setTimeout(() => {
      searchGame("normal");
    }, 1000);
  });
}

// src/index.ts
boards[0].id = "board_opponent";
boards[1].id = "board_my";
var rows = boards[0].qs(".rows").children;
rows[0].parentNode.insertBefore(rows[1], rows[0]);
boardsComp[1].events();
setupUnusedCardsEvents();
setupTargetingEvents();
setupKeyboardEvents();
switchPage("main");
getUserInfo();
loadCards2();

//# debugId=1B7A9507577DD4BF64756E2164756E21
//# sourceMappingURL=init.js.map
