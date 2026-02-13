import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { isDemoChannel } from '../../services/publicOffers';
import toast from 'react-hot-toast';
import './OffersPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export default function OffersPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ niche: '' });
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ type: 'subs', description: '', niche: '', minSubscribers: 0, maxSubscribers: 0 });
    const [myChannels, setMyChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState('');

    useEffect(() => {
        loadOffers();
        if (user) loadMyChannels();
    }, []);

    async function loadOffers() {
        try {
            const params = new URLSearchParams();
            if (filter.niche) params.set('niche', filter.niche);
            const res = await api.get(`/offers?${params.toString()}`);
            setOffers(res.data.offers || res.data || []);
        } catch (error) {
            console.error('Failed to load offers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadMyChannels() {
        try {
            const res = await api.get('/channels/my');
            setMyChannels(res.data.channels || []);
            if (res.data.channels?.length > 0) {
                setSelectedChannelId(res.data.channels[0].id);
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
        }
    }

    async function handleCreateOffer() {
        if (!selectedChannelId) {
            toast.error('РЎРїРѕС‡Р°С‚РєСѓ РїС–РґРєР»СЋС‡С–С‚СЊ РєР°РЅР°Р»');
            return;
        }
        try {
            await api.post('/offers', {
                channelId: selectedChannelId,
                ...createForm,
            });
            toast.success('РџСЂРѕРїРѕР·РёС†С–СЋ СЃС‚РІРѕСЂРµРЅРѕ!');
            setShowCreate(false);
            setCreateForm({ type: 'subs', description: '', niche: '', minSubscribers: 0, maxSubscribers: 0 });
            loadOffers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'РќРµ РІРґР°Р»РѕСЃСЏ СЃС‚РІРѕСЂРёС‚Рё РїСЂРѕРїРѕР·РёС†С–СЋ');
        }
    }

    async function handleRespond(offerId) {
        if (!selectedChannelId) {
            toast.error('РЎРїРѕС‡Р°С‚РєСѓ РїС–РґРєР»СЋС‡С–С‚СЊ РєР°РЅР°Р»');
            return;
        }
        try {
            await api.post(`/offers/${offerId}/respond`, { channelId: selectedChannelId });
            toast.success('Р’С–РґРіСѓРє РЅР°РґС–СЃР»Р°РЅРѕ!');
            loadOffers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'РќРµ РІРґР°Р»РѕСЃСЏ РІС–РґРіСѓРєРЅСѓС‚РёСЃСЏ');
        }
    }

    useEffect(() => {
        loadOffers();
    }, [filter]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ РїСЂРѕРїРѕР·РёС†С–Р№...</p>
            </div>
        );
    }

    return (
        <div className="offers-page">
            <div className="offers-header">
                <div>
                    <h1>РљР°С‚Р°Р»РѕРі РїСЂРѕРїРѕР·РёС†С–Р№</h1>
                    <p className="offers-subtitle">Р—РЅР°Р№РґС–С‚СЊ РїР°СЂС‚РЅРµСЂР° РґР»СЏ РѕР±РјС–РЅСѓ С‚СЂР°С„С–РєРѕРј</p>
                </div>
                {user && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        вћ• РЎС‚РІРѕСЂРёС‚Рё РїСЂРѕРїРѕР·РёС†С–СЋ
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="offers-filters card">
                <input
                    type="text"
                    className="filter-input"
                    placeholder="Р¤С–Р»СЊС‚СЂ Р·Р° РЅС–С€РµСЋ..."
                    value={filter.niche}
                    onChange={(e) => setFilter(prev => ({ ...prev, niche: e.target.value }))}
                />
            </div>

            {/* Offers list */}
            {offers.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">рџ”Ќ</span>
                    <h3>РџСЂРѕРїРѕР·РёС†С–Р№ РїРѕРєРё РЅРµРјР°С”</h3>
                    <p>РЎС‚РІРѕСЂС–С‚СЊ РїРµСЂС€Сѓ РїСЂРѕРїРѕР·РёС†С–СЋ РѕР±РјС–РЅСѓ!</p>
                </div>
            ) : (
                <div className="offers-grid">
                    {offers.map(offer => (
                        <div key={offer.id} className="offer-card card">
                            <div className="offer-card-top">
                                <img
                                    src={offer.channel?.channelAvatar || ''}
                                    alt=""
                                    className="offer-card-avatar"
                                />
                                <div className="offer-card-channel">
                                    <span className="offer-card-name">
                                        {offer.channel?.channelTitle || 'РљР°РЅР°Р»'}
                                        {isDemoChannel(offer.channel) && (
                                            <span className="offer-demo-badge" title="Демо-канал" aria-label="Демо-канал">
                                                ◉
                                            </span>
                                        )}
                                    </span>
                                    <span className="offer-card-subs">
                                        {formatNumber(offer.channel?.subscribers)} РїС–РґРїРёСЃРЅРёРєС–РІ
                                    </span>
                                </div>
                                <span className={`offer-type-badge ${offer.type}`}>
                                    {offer.type === 'subs' ? 'рџ‘Ґ РџС–РґРїРёСЃРЅРёРєРё' : 'рџ‘Ѓ РџРµСЂРµРіР»СЏРґРё'}
                                </span>
                            </div>

                            {offer.description && (
                                <p className="offer-card-desc">{offer.description}</p>
                            )}

                            <div className="offer-card-tags">
                                {offer.niche && <span className="meta-tag">{offer.niche}</span>}
                                {offer.language && <span className="meta-tag">{offer.language}</span>}
                                {offer.minSubscribers > 0 && (
                                    <span className="meta-tag">РІС–Рґ {formatNumber(offer.minSubscribers)} РїС–РґРїРёСЃ.</span>
                                )}
                            </div>

                            <div className="offer-card-actions">
                                {user ? (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleRespond(offer.id)}
                                    >
                                        рџ¤ќ Р’С–РґРіСѓРєРЅСѓС‚РёСЃСЏ
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate('/auth')}
                                    >
                                        рџ”ђ РЈРІС–Р№С‚Рё РґР»СЏ РІС–РґРіСѓРєСѓ
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Offer Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content create-offer-modal" onClick={e => e.stopPropagation()}>
                        <h3>РЎС‚РІРѕСЂРёС‚Рё РїСЂРѕРїРѕР·РёС†С–СЋ РѕР±РјС–РЅСѓ</h3>

                        <div className="form-group">
                            <label className="form-label">РљР°РЅР°Р»</label>
                            <select
                                className="filter-select full-width"
                                value={selectedChannelId}
                                onChange={(e) => setSelectedChannelId(e.target.value)}
                            >
                                {myChannels.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.channelTitle}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">РўРёРї РѕР±РјС–РЅСѓ</label>
                            <select
                                className="filter-select full-width"
                                value={createForm.type}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="subs">рџ‘Ґ РџС–РґРїРёСЃРЅРёРєРё</option>
                                <option value="views">рџ‘Ѓ РџРµСЂРµРіР»СЏРґРё</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">РћРїРёСЃ</label>
                            <textarea
                                className="review-textarea"
                                placeholder="РћРїРёС€С–С‚СЊ, С‰Рѕ РІРё РїСЂРѕРїРѕРЅСѓС”С‚Рµ..."
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">РќС–С€Р° (РЅРµРѕР±РѕРІ'СЏР·РєРѕРІРѕ)</label>
                            <input
                                type="text"
                                className="filter-input full-width"
                                placeholder="РќР°РїСЂРёРєР»Р°Рґ: Gaming, Tech, Music..."
                                value={createForm.niche}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, niche: e.target.value }))}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">РњС–РЅ. РїС–РґРїРёСЃРЅРёРєС–РІ</label>
                                <input
                                    type="number"
                                    className="filter-input full-width"
                                    value={createForm.minSubscribers}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, minSubscribers: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">РњР°РєСЃ. РїС–РґРїРёСЃРЅРёРєС–РІ</label>
                                <input
                                    type="number"
                                    className="filter-input full-width"
                                    value={createForm.maxSubscribers}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, maxSubscribers: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                РЎРєР°СЃСѓРІР°С‚Рё
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateOffer}>
                                РЎС‚РІРѕСЂРёС‚Рё
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


