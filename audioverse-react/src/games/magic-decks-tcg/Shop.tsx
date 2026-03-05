/**
 * Shop.tsx — Card shop UI for MagicDecks TCG.
 *
 * Sections: Boosters (1x / 10x), rotating card offers, pre-built decks.
 * Shows player currency at the top. Booster opening shows revealed cards.
 */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerProfile, BoosterTier, Rarity, ShopState } from './types'
import { RARITY_COLORS, RARITY_ICONS, ELEMENT_ICONS } from './types'
import { CARDS_BY_ID } from './cardDatabase'
import {
  BOOSTER_DEFS, BOOSTER_ICONS, BOOSTER_COLORS,
  get10PackPrice, get10PackCount,
  canAffordBooster, canAfford10Pack,
  buyBooster, buy10Pack,
  buyCardOffer, buyDeckOffer,
  loadShopState, saveShopState, refreshShop, getTimeUntilRefresh,
} from './shopLogic'
import styles from './SharedGame.module.css'

interface Props {
  profile: PlayerProfile
  onProfileUpdate: (p: PlayerProfile) => void
  onBack: () => void
}

export default function Shop({ profile, onProfileUpdate, onBack }: Props) {
  const { t } = useTranslation()
  const [shop, setShop] = useState<ShopState>(loadShopState)
  const [openedCards, setOpenedCards] = useState<string[] | null>(null)
  const [refreshTimer, setRefreshTimer] = useState(0)

  // Refresh timer
  useEffect(() => {
    const iv = setInterval(() => {
      const ms = getTimeUntilRefresh(shop)
      setRefreshTimer(ms)
      if (ms <= 0) {
        const newShop = refreshShop(shop)
        setShop(newShop)
        saveShopState(newShop)
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [shop])

  const save = useCallback((p: PlayerProfile, s: ShopState) => {
    onProfileUpdate({ ...p })
    setShop({ ...s })
    saveShopState(s)
  }, [onProfileUpdate])

  // ── Booster purchase ────────────────────────────────────
  const handleBuy1 = useCallback((tier: BoosterTier) => {
    const p = { ...profile }
    const cards = buyBooster(p, tier)
    if (cards) {
      setOpenedCards(cards)
      save(p, shop)
    }
  }, [profile, shop, save])

  const handleBuy10 = useCallback((tier: BoosterTier) => {
    const p = { ...profile }
    const cards = buy10Pack(p, tier)
    if (cards) {
      setOpenedCards(cards)
      save(p, shop)
    }
  }, [profile, shop, save])

  // ── Card offer purchase ─────────────────────────────────
  const handleBuyCard = useCallback((index: number) => {
    const p = { ...profile }
    const s = { ...shop, cardOffers: [...shop.cardOffers] }
    if (buyCardOffer(p, s, index)) {
      save(p, s)
    }
  }, [profile, shop, save])

  // ── Deck offer purchase ─────────────────────────────────
  const handleBuyDeck = useCallback((index: number) => {
    const p = { ...profile }
    const s = { ...shop, deckOffers: [...shop.deckOffers] }
    if (buyDeckOffer(p, s, index)) {
      save(p, s)
    }
  }, [profile, shop, save])

  // ── Manual refresh ──────────────────────────────────────
  const handleForceRefresh = useCallback(() => {
    // Costs 10 gems to force refresh
    if (profile.gems >= 10) {
      const p = { ...profile }
      p.gems -= 10
      const newShop = refreshShop(shop)
      save(p, newShop)
    }
  }, [profile, shop, save])

  // Format time
  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Rarity label
  const rarityLabel = (r: Rarity) => {
    const map: Record<Rarity, string> = {
      common: t('magicDecks.shop.common', 'Common'),
      uncommon: t('magicDecks.shop.uncommon', 'Uncommon'),
      rare: t('magicDecks.shop.rare', 'Rare'),
      epic: t('magicDecks.shop.epic', 'Epic'),
      legendary: t('magicDecks.shop.legendary', 'Legendary'),
    }
    return map[r]
  }

  const tiers: BoosterTier[] = ['bronze', 'silver', 'gold', 'diamond']

  return (
    <div className={styles.menuContainer}>
      <h1 className={styles.menuTitle}>
        🛒 {t('magicDecks.shop.title', 'Card Shop')}
      </h1>

      {/* Currency bar */}
      <div className={styles.shopCurrencyBar}>
        <span className={styles.shopCurrency}>🪙 {profile.coins.toLocaleString()}</span>
        <span className={styles.shopCurrency}>💎 {profile.gems.toLocaleString()}</span>
        <span className={styles.shopCurrency}>
          🃏 {new Set(profile.collection).size} {t('magicDecks.shop.unique', 'unique')}
        </span>
      </div>

      {/* Opened cards reveal */}
      {openedCards && (
        <div className={styles.shopReveal}>
          <h3>{t('magicDecks.shop.opened', 'Cards Opened!')}</h3>
          <div className={styles.shopRevealGrid}>
            {openedCards.map((id, i) => {
              const card = CARDS_BY_ID.get(id)
              if (!card) return null
              return (
                <div
                  key={`${id}-${i}`}
                  className={styles.shopRevealCard}
                  style={{ borderColor: RARITY_COLORS[card.rarity] }}
                >
                  <div className={styles.shopRevealRarity} style={{ color: RARITY_COLORS[card.rarity] }}>
                    {RARITY_ICONS[card.rarity]} {rarityLabel(card.rarity)}
                  </div>
                  <div className={styles.shopRevealName}>
                    {ELEMENT_ICONS[card.element]} {card.name}
                  </div>
                  <div className={styles.shopRevealStats}>
                    ⚔️{card.atk} 🛡️{card.def} ⚡{card.cost}
                  </div>
                </div>
              )
            })}
          </div>
          <button className={styles.shopBtn} onClick={() => setOpenedCards(null)}>
            {t('magicDecks.shop.close', 'Close')}
          </button>
        </div>
      )}

      {/* ── Boosters Section ─────────────────────────────── */}
      <h2 className={styles.shopSectionTitle}>
        📦 {t('magicDecks.shop.boosters', 'Boosters')}
      </h2>
      <p className={styles.shopHint}>
        {t('magicDecks.shop.boosterHint', '10-pack = 11 boosters! 3 cards per booster.')}
      </p>
      <div className={styles.shopBoosterGrid}>
        {tiers.map(tier => {
          const def = BOOSTER_DEFS[tier]
          const pack10 = get10PackPrice(tier)
          const can1 = canAffordBooster(profile, tier)
          const can10 = canAfford10Pack(profile, tier)

          return (
            <div
              key={tier}
              className={styles.shopBoosterCard}
              style={{ borderColor: BOOSTER_COLORS[tier] }}
            >
              <div className={styles.shopBoosterHeader} style={{ background: BOOSTER_COLORS[tier] + '33' }}>
                <span className={styles.shopBoosterIcon}>{BOOSTER_ICONS[tier]}</span>
                <span className={styles.shopBoosterName}>
                  {t(`magicDecks.shop.tier_${tier}`, tier.charAt(0).toUpperCase() + tier.slice(1))}
                </span>
              </div>
              <div className={styles.shopBoosterInfo}>
                <div>
                  {def.weights.map((w, i) => (
                    <span key={i} style={{ color: RARITY_COLORS[(['common', 'uncommon', 'rare', 'epic', 'legendary'] as Rarity[])[i]], fontSize: '0.7em' }}>
                      {RARITY_ICONS[(['common', 'uncommon', 'rare', 'epic', 'legendary'] as Rarity[])[i]]} {w}%{' '}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.shopBoosterActions}>
                <button
                  className={`${styles.shopBtn} ${!can1 ? styles.shopBtnDisabled : ''}`}
                  onClick={() => handleBuy1(tier)}
                  disabled={!can1}
                >
                  1× {def.priceCoins > 0 ? `🪙${def.priceCoins}` : `💎${def.priceGems}`}
                </button>
                <button
                  className={`${styles.shopBtn} ${styles.shopBtn10} ${!can10 ? styles.shopBtnDisabled : ''}`}
                  onClick={() => handleBuy10(tier)}
                  disabled={!can10}
                >
                  10× → {get10PackCount()}! {pack10.coins > 0 ? `🪙${pack10.coins}` : `💎${pack10.gems}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Card Offers Section ──────────────────────────── */}
      <h2 className={styles.shopSectionTitle}>
        🎴 {t('magicDecks.shop.cardOffers', 'Card Offers')}
        <span className={styles.shopTimer}>
          ⏱️ {formatTime(refreshTimer)}
        </span>
        <button
          className={styles.shopRefreshBtn}
          onClick={handleForceRefresh}
          disabled={profile.gems < 10}
          title={t('magicDecks.shop.forceRefresh', 'Force refresh (10 💎)')}
        >
          🔄 10💎
        </button>
      </h2>
      <div className={styles.shopOfferGrid}>
        {shop.cardOffers.map((offer, i) => {
          const card = CARDS_BY_ID.get(offer.cardId)
          if (!card) return null
          const canBuy = profile.coins >= offer.priceCoins && profile.gems >= offer.priceGems
          return (
            <div
              key={`${offer.cardId}-${i}`}
              className={styles.shopOfferCard}
              style={{ borderColor: RARITY_COLORS[card.rarity] }}
            >
              <div className={styles.shopOfferRarity} style={{ color: RARITY_COLORS[card.rarity] }}>
                {RARITY_ICONS[card.rarity]} {rarityLabel(card.rarity)}
              </div>
              <div className={styles.shopOfferName}>
                {ELEMENT_ICONS[card.element]} {card.name}
              </div>
              <div className={styles.shopOfferType}>{card.type}</div>
              <div className={styles.shopOfferStats}>
                ⚔️{card.atk} 🛡️{card.def} ⚡{card.cost}
              </div>
              <button
                className={`${styles.shopBtn} ${!canBuy ? styles.shopBtnDisabled : ''}`}
                onClick={() => handleBuyCard(i)}
                disabled={!canBuy}
              >
                {offer.priceCoins > 0 && `🪙${offer.priceCoins} `}
                {offer.priceGems > 0 && `💎${offer.priceGems}`}
              </button>
            </div>
          )
        })}
        {shop.cardOffers.length === 0 && (
          <p className={styles.shopEmpty}>{t('magicDecks.shop.noOffers', 'No offers available. Wait for refresh!')}</p>
        )}
      </div>

      {/* ── Deck Offers Section ──────────────────────────── */}
      <h2 className={styles.shopSectionTitle}>
        📚 {t('magicDecks.shop.deckOffers', 'Pre-built Decks')}
      </h2>
      <div className={styles.shopDeckGrid}>
        {shop.deckOffers.map((offer, i) => (
          <div key={`${offer.name}-${i}`} className={styles.shopDeckCard}>
            <div className={styles.shopDeckHeader}>
              {ELEMENT_ICONS[offer.element]} {offer.name}
            </div>
            <div className={styles.shopDeckInfo}>
              🃏 {offer.cardIds.length} {t('magicDecks.shop.cards', 'cards')}
            </div>
            <button
              className={`${styles.shopBtn} ${profile.coins < offer.priceCoins ? styles.shopBtnDisabled : ''}`}
              onClick={() => handleBuyDeck(i)}
              disabled={profile.coins < offer.priceCoins || profile.gems < offer.priceGems}
            >
              {offer.priceCoins > 0 && `🪙${offer.priceCoins} `}
              {offer.priceGems > 0 && `💎${offer.priceGems}`}
            </button>
          </div>
        ))}
        {shop.deckOffers.length === 0 && (
          <p className={styles.shopEmpty}>{t('magicDecks.shop.noDecks', 'All decks purchased!')}</p>
        )}
      </div>

      <button className={styles.menuBackBtn} onClick={onBack}>
        ← {t('miniGames.backToMenu', 'Back to Menu')}
      </button>
    </div>
  )
}
