import { useState, useEffect, useRef } from 'react';
import './App.css';

import restaurantImg from './restaurant.jpg'; 
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
const TELEGRAM_CHAT_ID = 'ВАШ_CHAT_ID';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [cart, setCart] = useState([]);
  
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [paymentMethod, setPaymentMethod] = useState('qr');
  
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Изменили порог с 100 на 10 пикселей: теперь шапка прячется сразу при первом же прокруте
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const desserts = [
    { id: 1, name: '«Ванильная нежность»', price: 350, icon: '🥐', image: vanillaCroissant },
    { id: 2, name: '«Двойной шоколад»', price: 350, icon: '🍫', image: chocoCroissant },
    { id: 3, name: '«Банановый рай»', price: 350, icon: '🍌', image: bananaCroissant },
  ];

  const drinks = [
    { id: 4, name: 'Эспрессо', price: 150, icon: '☕', image: espressoImg },
    { id: 5, name: 'Американо', price: 180, icon: '☕', image: americanoImg },
    { id: 6, name: 'Капучино', price: 220, icon: '☕', image: cappuccinoImg },
    { id: 7, name: 'Латте', price: 240, icon: '🥛', image: latteImg },
    { id: 8, name: 'Айс-латте', price: 260, icon: '🧊', image: iceLatteImg },
    { id: 9, name: 'Бабл-ти', price: 350, icon: '🧋', image: bubbleTeaImg },
  ];

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setIsCartOpen(true);
    setCheckoutStep('cart');
  };
  
  const removeFromCart = (idToRemove) => setCart(cart.filter(item => item.id !== idToRemove));
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const sendOrderToTelegram = async () => {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ВАШ_ТОКЕН_БОТА') {
      alert('Демо-режим: оплата прошла, но заказ никуда не отправлен (вставьте токен).');
      return true; 
    }

    const paymentNames = { 'qr': 'QR-код (СБП)', 'card': 'Карта онлайн', 'cash': 'Наличными при получении' };
    
    let message = `🚨 <b>Новый заказ!</b>\n\n`;
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
          chat_id: TELEGRAM_CHAT_ID,
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
      setIsCartOpen(false);
      setCheckoutStep('cart');
    }
  };

  return (
    <div className="app-container">
      <header className={`header ${showHeader ? '' : 'hidden'}`} style={{ backgroundImage: `url(${restaurantImg})` }}>
        <div className="header-overlay">
          <h1>У кофемана</h1>
          <button className="info-btn" onClick={() => setIsModalOpen(true)}>О нас</button>
        </div>
      </header>

      <main className="menu-section">
        <h2>Свежая выпечка</h2>
        <div className="grid">
          {desserts.map((item) => (
            <div key={item.id} className="card">
              <div className="card-icon">{item.image ? <img src={item.image} alt={item.name} className="card-image" /> : item.icon}</div>
              <h3>{item.name}</h3>
              <div className="card-footer">
                <p className="price">{item.price} ₽</p>
                <button className="buy-btn" onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <h2>Напитки</h2>
        <div className="grid">
          {drinks.map((item) => (
            <div key={item.id} className="card">
              <div className="card-icon">{item.image ? <img src={item.image} alt={item.name} className="card-image" /> : item.icon}</div>
              <h3>{item.name}</h3>
              <div className="card-footer">
                <p className="price">{item.price} ₽</p>
                <button className="buy-btn" onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {cart.length > 0 && !isCartOpen && (
        <button className="floating-cart-btn" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }}>
          <span>🛒 Мой заказ</span>
          <span className="cart-badge">{cartTotal} ₽</span>
        </button>
      )}

      {isCartOpen && cart.length > 0 && (
        <div className="cart-panel">
          <div className="cart-header">
            <h2>{checkoutStep === 'cart' ? 'Корзина' : checkoutStep === 'payment' ? 'Оплата' : 'Чек'}</h2>
            <button className="panel-close-btn" onClick={() => setIsCartOpen(false)}>✖</button>
          </div>

          {checkoutStep === 'cart' && (
            <>
              <ul className="cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <span>
                      {item.name} 
                      {item.quantity > 1 && <strong style={{color: '#666', marginLeft: '8px'}}>x{item.quantity}</strong>}
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
              <p>Выберите способ оплаты:</p>
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
              <h3>Сумма: {cartTotal} ₽</h3>
              {paymentMethod === 'qr' && (
                <div className="qr-placeholder">
                  <p>Отсканируйте код<br/>в приложении банка</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Оплата_Кофеман_${cartTotal}`} alt="QR" />
                </div>
              )}
              {paymentMethod === 'card' && <div className="card-mock">Ожидание оплаты картой...</div>}
              {paymentMethod === 'cash' && <div className="card-mock">Покажите этот экран кассиру</div>}
              
              <button className="order-btn finish-btn" onClick={finishPayment}>
                {paymentMethod === 'cash' ? 'Завершить заказ' : 'Эмулировать успешную оплату'}
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✖</button>
            <div className="tabs">
              <button onClick={() => setActiveTab('description')} className={activeTab === 'description' ? 'active' : ''}>Описание</button>
              <button onClick={() => setActiveTab('contacts')} className={activeTab === 'contacts' ? 'active' : ''}>Связь</button>
            </div>
            <div className="tab-content">
              {activeTab === 'description' && (
                <p>
                  Добро пожаловать в <b>«У Кофемана»</b> — место, где начинается ваш идеальный день! 
                  <br/><br/>
                  Мы гордимся тем, что каждое утро наши пекари создают воздушные круассаны ручной работы по классическим французским рецептам, используя премиальное сливочное масло. 
                  <br/><br/>
                  Наш кофе — это 100% арабика свежей обжарки. Крепкий эспрессо, мягкий латте или трендовый бабл-ти — у нас найдется напиток для каждого.
                </p>
              )}
              {activeTab === 'contacts' && (
                <div className="contacts-tab">
                  <p>📞 +7 (999) 123-45-67<br/>📍 ул. Кофейная, д. 1</p>
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