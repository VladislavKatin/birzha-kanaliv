import {
    formatPublicNumber,
    getLanguageLabel,
    getNicheLabel,
    getOfferTypeLabel,
    normalizeOfferDescription,
} from '../../services/publicOffers';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './OfferPreviewModal.css';

export default function OfferPreviewModal({ offer, onClose, onPropose }) {
    if (!offer) {
        return null;
    }

    const channel = offer.channel || {};

    return (
        <div className="offer-preview-overlay" role="dialog" aria-modal="true">
            <div className="offer-preview-modal">
                <button className="offer-preview-close" onClick={onClose} aria-label="Закрити">
                    x
                </button>

                <header className="offer-preview-header">
                    <img src={resolveChannelAvatar(channel.channelAvatar, channel.channelTitle)} data-fallback-src={buildFallbackAvatar(channel.channelTitle)} onError={handleAvatarError} alt={channel.channelTitle || 'Канал'} />
                    <div>
                        <h3>{channel.channelTitle || 'Канал'}</h3>
                        <p>{getOfferTypeLabel(offer.type)}</p>
                    </div>
                </header>

                <div className="offer-preview-grid">
                    <div>
                        <h4>Статистика каналу</h4>
                        <ul>
                            <li>Підписники: {formatPublicNumber(channel.subscribers)}</li>
                            <li>Перегляди: {formatPublicNumber(channel.totalViews)}</li>
                            <li>Відео: {formatPublicNumber(channel.totalVideos)}</li>
                            <li>Сер. переглядів (30д): {formatPublicNumber(channel.avgViews30d)}</li>
                            <li>Приріст підписників (30д): {formatPublicNumber(channel.subGrowth30d)}</li>
                            <li>Середній watch time: {channel.averageWatchTime || 0} хв</li>
                            <li>CTR: {channel.ctr || 0}%</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Профіль каналу</h4>
                        <ul>
                            <li>Ніша: {getNicheLabel(offer.niche || channel.niche) || 'Не вказано'}</li>
                            <li>Мова: {getLanguageLabel(offer.language || channel.language) || 'Не вказано'}</li>
                            <li>Країна: {channel.country || 'Не вказано'}</li>
                        </ul>
                        <h4>Опис каналу</h4>
                        <p>{channel.description || 'Опис каналу відсутній.'}</p>
                    </div>
                </div>

                <div className="offer-preview-comment">
                    <h4>Коментар від автора пропозиції</h4>
                    <p>{normalizeOfferDescription(offer.description, channel.channelTitle) || 'Коментар не додано.'}</p>
                </div>

                {typeof onPropose === 'function' && (
                    <div className="offer-preview-actions">
                        <button type="button" className="offer-preview-propose" onClick={() => onPropose(offer)}>
                            Запропонувати обмін
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

