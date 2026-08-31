import { useState, useEffect, useRef } from 'react';
import './App.css';

import vanillaCroissant from './круассан.jpg'; 
import chocoCroissant from './croissant_choco.jpg';
import bananaCroissant from './croissant_banana.jpg';
import espressoImg from './espresso.jpg';
import americanoImg from './americano.jpg';
import cappuccinoImg from './cappuccino.jpg';
import latteImg from './latte.jpg';
import iceLatteImg from './ice_latte.jpg';
import bubbleTeaImg from './bubble_tea.jpg';

const TELEGRAM_BOT_TOKEN = 'ВАШ_ТОКЕН_БОТА';

const branches = [
  { name: 'ул. Кофейная, д. 1 (Центральный)', chatId: 'CHAT_ID_CENTRAL' },
  { name: 'пр. Ленина, д. 45', chatId: 'CHAT_ID_LENINA' },
  { name: 'ТЦ «Гламур», 1 этаж', chatId: 'CHAT_ID_GLAMUR' },
  { name: 'ул. Пушкина, д. 12', chatId: 'CHAT_ID_PUSHKINA' },
  { name: 'Парковая аллея, павильон №3', chatId: 'CHAT_ID_PARK' }
];

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [cart, setCart] = useState([]);
  
  const [currentBranch, setCurrentBranch] = useState(branches[0]);
  
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [paymentMethod, setPaymentMethod] = useState('qr');
  
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 15) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const desserts = [
    { id: 1, name: '«Ванильная нежность»', price: 350, image: vanillaCroissant, desc: 'Классический французский круассан с заварным ванильным кремом.' },
    { id: 2, name: '«Двойной шоколад»', price: 350, image: chocoCroissant, desc: 'Насыщенный темный шоколад и глазурь из бельгийского какао.' },
    { id: 3, name: '«Банановый рай»', price: 350, image: bananaCroissant, desc: 'Свежий банан, карамельный соус и воздушное тесто.' },
  ];

  const drinks = [
    { id: 4, name: 'Эспрессо', price: 150, image: espressoImg },
    { id: 5, name: 'Американо', price: 180, image: americanoImg },
    { id: 6, name: 'Капучино', price: 220, image: cappuccinoImg },
    { id: 7, name: 'Латте', price: 240, image: latteImg },
    { id: 8, name: 'Айс-латте', price: 260, image: iceLatteImg },
    { id: 9, name: 'Бабл-ти', price: 350, image: bubbleTeaImg },
  ];

  const handleBranchClick = (branchObj) => {
    setCurrentBranch(branchObj);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  
  const removeFromCart = (idToRemove) => setCart(cart.filter(item => item.id !== idToRemove));
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => setCheckoutStep('cart'), 300);
  };

  const sendOrderToTelegram = async () => {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ВАШ_ТОКЕН_БОТА' || currentBranch.chatId.includes('CHAT_ID')) {
      alert(`✅ [Демо-режим] Заказ для филиала "${currentBranch.name}" успешно оформлен!`);
      return true; 
    }

    const paymentNames = { 'qr': 'QR-код (СБП)', 'card': 'Карта онлайн', 'cash': 'Наличными при получении' };
    
    let message = `🚨 <b>Новый заказ!</b>\n📍 <b>Филиал:</b> ${currentBranch.name}\n\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} — ${item.price * item.quantity} ₽\n`;
    });
    message += `\n💰 <b>Итого:</b> ${cartTotal} ₽\n💳 <b>Оплата:</b> ${paymentNames[paymentMethod]}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: currentBranch.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        throw new Error('Telegram отклонил запрос');
      }
      return true;

    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Произошла ошибка при отправке заказа. Проверьте интернет и попробуйте снова.');
      return false; 
    }
  };

  const finishPayment = async () => {
    const isSuccess = await sendOrderToTelegram();
    if (isSuccess) {
      setCart([]);
      closeCart();
    }
  };

  return (
    <div className="app-container">
      <div 
        className={`custom-cursor ${isHovered ? 'hovered' : ''}`} 
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      <header className={`header ${showHeader ? '' : 'hidden'}`}>
        <div className="logo-container">
          <h1>У <span>Кофемана</span></h1>
        </div>
        
        <div className="header-location">
          <span>📍</span> {currentBranch.name}
        </div>

        <div className="header-actions">
          <button className="info-btn" onClick={() => setIsModalOpen(true)}>О кофейне</button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">
            Искусство <br />
            <span className="outline-text">Вашего</span> Утра
          </h2>
          <p className="hero-subtitle">
            Филиал: <b>{currentBranch.name}</b>. Авторские круассаны ручной работы и премиальный кофе свежей обжарки.
          </p>
          <button className="order-btn" style={{ maxWidth: '220px' }} onClick={() => {
            const menuEl = document.getElementById('menu-anchor');
            menuEl?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Смотреть меню
          </button>
        </div>
        <div className="hero-image-wrapper">
          <img src={vanillaCroissant} alt="Круассан" className="hero-floating-img" />
          <div className="floating-badge">
            <h4>100% Арабика</h4>
            <p>Свежая обжарка зерен</p>
          </div>
        </div>
      </section>

      <main className="menu-section" id="menu-anchor">
        <h2 className="section-title">Свежая выпечка</h2>
        <div className="bento-grid">
          {desserts.map((item, index) => {
            const spanClass = index === 0 ? 'span-7' : 'span-5';
            return (
              <div key={item.id} className={`bento-card ${spanClass}`}>
                <div className="card-image-container">
                  <img src={item.image} alt={item.name} className="card-image" />
                </div>
                <div className="bento-info">
                  <h3>{item.name}</h3>
                  {item.desc && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>}
                </div>
                <div className="card-footer">
                  <p className="price">{item.price} ₽</p>
                  <button className="buy-btn" onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="section-title">Напитки</h2>
        <div className="bento-grid">
          {drinks.map((item, index) => {
            const spanClasses = ['span-4', 'span-8', 'span-6', 'span-6', 'span-5', 'span-7'];
            const spanClass = spanClasses[index % spanClasses.length];
            return (
              <div key={item.id} className={`bento-card ${spanClass}`}>
                <div className="card-image-container">
                  <img src={item.image} alt={item.name} className="card-image" />
                </div>
                <div className="bento-info">
                  <h3>{item.name}</h3>
                </div>
                <div className="card-footer">
                  <p className="price">{item.price} ₽</p>
                  <button className="buy-btn" onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            {branches.map((branch, idx) => (
              <button key={idx} className="branch-link" onClick={() => handleBranchClick(branch)}>
                📍 {branch.name} <span>✦</span>
              </button>
            ))}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {branches.map((branch, idx) => (
              <button key={`dup-${idx}`} className="branch-link" onClick={() => handleBranchClick(branch)}>
                📍 {branch.name} <span>✦</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {cart.length > 0 && !isCartOpen && (
        <button className="floating-cart-btn" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }}>
          <span>🛒 Мой заказ</span>
          <span className="cart-badge">{cartTotal} ₽</span>
        </button>
      )}

      {isCartOpen && (
        <div className="cart-panel-overlay" onClick={closeCart}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>{checkoutStep === 'cart' ? 'Корзина' : checkoutStep === 'payment' ? 'Оплата' : 'Чек'}</h2>
              <button className="panel-close-btn" onClick={closeCart}>✖</button>
            </div>

            {checkoutStep === 'cart' && (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                  Филиал получения: <strong style={{ color: 'var(--text-main)' }}>{currentBranch.name}</strong>
                </p>
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.id} className="cart-item">
                      <span>
                        {item.name} 
                        {item.quantity > 1 && <strong style={{color: 'var(--accent-gold)', marginLeft: '8px'}}>x{item.quantity}</strong>}
                      </span>
                      <div className="cart-item-right">
                        <span>{item.price * item.quantity} ₽</span>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>×</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-total"><span>Итого:</span><span>{cartTotal} ₽</span></div>
                <button className="order-btn" onClick={() => setCheckoutStep('payment')}>Перейти к оплате</button>
              </>
            )}

            {checkoutStep === 'payment' && (
              <div className="payment-step">
                <p style={{ color: 'var(--text-muted)' }}>Выберите способ оплаты:</p>
                <div className="payment-options">
                  <label className={`pay-label ${paymentMethod === 'qr' ? 'selected' : ''}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} />
                    📱 СБП (QR-код)
                  </label>
                  <label className={`pay-label ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    💳 Банковская карта
                  </label>
                  <label className={`pay-label ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                    💵 Наличными
                  </label>
                </div>
                <div className="cart-total" style={{marginTop: '20px'}}><span>К оплате:</span><span>{cartTotal} ₽</span></div>
                <button className="order-btn" onClick={() => setCheckoutStep('receipt')}>Оплатить заказ</button>
                <button className="back-btn" onClick={() => setCheckoutStep('cart')}>Назад</button>
              </div>
            )}

            {checkoutStep === 'receipt' && (
              <div className="receipt-step">
                <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem' }}>Сумма: {cartTotal} ₽</h3>
                {paymentMethod === 'qr' && (
                  <div className="qr-placeholder">
                    <p style={{ color: '#333', fontSize: '0.9rem', marginBottom: '5px' }}>Отсканируйте код в приложении банка</p>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Оплата_Кофеман_${cartTotal}`} alt="QR" />
                  </div>
                )}
                {paymentMethod === 'card' && <div className="card-mock">Ожидание безопасного соединения с банком...</div>}
                {paymentMethod === 'cash' && <div className="card-mock">Покажите этот экран бариста при получении</div>}
                
                <button className="order-btn finish-btn" onClick={finishPayment}>
                  {paymentMethod === 'cash' ? 'Завершить заказ' : 'Эмулировать успешную оплату'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✖</button>
            <div className="tabs">
              <button onClick={() => setActiveTab('description')} className={activeTab === 'description' ? 'active' : ''}>О кофейне</button>
              <button onClick={() => setActiveTab('contacts')} className={activeTab === 'contacts' ? 'active' : ''}>Контакты</button>
            </div>
            <div className="tab-content">
              {activeTab === 'description' && (
                <p>
                  Добро пожаловать в <b>«У Кофемана»</b> — пространство эстетики и безупречного вкуса. 
                  <br/><br/>
                  Каждое утро наши пекари создают воздушные круассаны по классическим французским рецептам. Мы используем только премиальное сливочное масло и отборные ингредиенты.
                </p>
              )}
              {activeTab === 'contacts' && (
                <div className="contacts-tab">
                  <p>📞 +7 (999) 123-45-67<br/>📍 {currentBranch.name}</p>
                  <a 
                    href="https://yandex.ru/maps" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="review-link-btn"
                  >
                    ⭐ Оставить отзыв на Яндекс.Картах
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
