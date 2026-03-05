/**
 * DeckBuilder.tsx — Full deck builder with card collection browser,
 * drag-to-add, deck slot management, and live 3-criteria rating.
 */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerProfile, SavedDeck, Element, CardDef } from './types'
import { ELEMENT_ICONS, ELEMENT_COLORS } from './types'
import { ALL_CARDS, CARDS_BY_ID } from './cardDatabase'
import { getCollectionCounts, saveDeck } from './progression'
import { rateDeck } from './deckRating'
import { DECK_MIN_SIZE, DECK_MAX_SIZE, MAX_COPIES_PER_CARD } from './constants'
import styles from './SharedGame.module.css'

interface Props {
  profile: PlayerProfile
  onBack: () => void
  onProfileUpdate: (profile: PlayerProfile) => void
}

const ALL_ELEMENTS: Element[] = ['fire', 'water', 'earth', 'air', 'light', 'dark']

export default function DeckBuilder({ profile, onBack, onProfileUpdate }: Props) {
  const { t } = useTranslation()
  const [activeSlot, setActiveSlot] = useState(0)
  const [editDeck, setEditDeck] = useState<SavedDeck>(() => ({
    ...profile.deckSlots[0] ?? { id: 'deck_1', name: 'Deck 1', cardIds: [], elements: [] },
  }))
  const [filterElement, setFilterElement] = useState<Element | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [deckName, setDeckName] = useState(editDeck.name)

  const collectionCounts = useMemo(() => getCollectionCounts(profile), [profile])

  // Cards available in collection, filtered
  const availableCards = useMemo(() => {
    let cards = ALL_CARDS.filter(c => collectionCounts.has(c.id))
    if (filterElement) cards = cards.filter(c => c.element === filterElement)
    if (filterType) cards = cards.filter(c => c.type === filterType)
    return cards
  }, [collectionCounts, filterElement, filterType])

  // Count how many of each card are already in the deck
  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const id of editDeck.cardIds) counts.set(id, (counts.get(id) || 0) + 1)
    return counts
  }, [editDeck.cardIds])

  // Live deck rating
  const rating = useMemo(() => rateDeck(editDeck.cardIds), [editDeck.cardIds])

  const addCard = useCallback((cardId: string) => {
    const inDeck = deckCounts.get(cardId) || 0
    const owned = collectionCounts.get(cardId) || 0
    if (inDeck >= MAX_COPIES_PER_CARD || inDeck >= owned) return
    if (editDeck.cardIds.length >= DECK_MAX_SIZE) return
    setEditDeck(prev => ({ ...prev, cardIds: [...prev.cardIds, cardId] }))
  }, [deckCounts, collectionCounts, editDeck.cardIds.length])

  const removeCard = useCallback((index: number) => {
    setEditDeck(prev => ({
      ...prev,
      cardIds: prev.cardIds.filter((_, i) => i !== index),
    }))
  }, [])

  const handleSave = useCallback(() => {
    const updated = { ...editDeck, name: deckName }
    saveDeck(profile, activeSlot, updated)
    onProfileUpdate({ ...profile })
  }, [editDeck, deckName, profile, activeSlot, onProfileUpdate])

  const switchSlot = useCallback((index: number) => {
    setActiveSlot(index)
    const slot = profile.deckSlots[index]
    if (slot) {
      setEditDeck({ ...slot })
      setDeckName(slot.name)
    } else {
      setEditDeck({ id: `deck_${index + 1}`, name: `Deck ${index + 1}`, cardIds: [], elements: [] })
      setDeckName(`Deck ${index + 1}`)
    }
  }, [profile.deckSlots])

  const renderStars = (n: number) => {
    const full = Math.floor(n)
    const half = n - full >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))
  }

  // Group deck cards for display
  const deckDisplay = useMemo(() => {
    const grouped = new Map<string, { def: CardDef; count: number; indices: number[] }>()
    editDeck.cardIds.forEach((id, idx) => {
      const existing = grouped.get(id)
      if (existing) {
        existing.count++
        existing.indices.push(idx)
      } else {
        const def = CARDS_BY_ID.get(id)
        if (def) grouped.set(id, { def, count: 1, indices: [idx] })
      }
    })
    return [...grouped.values()]
  }, [editDeck.cardIds])

  return (
    <div className={styles.menuContainer}>
      <h2 className={styles.menuTitle}>
        {t('magicDecks.deckBuilder.title', '🔧 Deck Builder')}
      </h2>

      {/* Deck slot tabs */}
      <div className={styles.deckSlotTabs}>
        {profile.deckSlots.map((slot, i) => (
          <button
            key={slot.id}
            className={`${styles.deckSlotTab} ${i === activeSlot ? styles.deckSlotTabActive : ''}`}
            onClick={() => switchSlot(i)}
          >
            {slot.name || `Deck ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className={styles.filterRow}>
        <button
          className={`${styles.filterBtn} ${!filterElement ? styles.filterBtnActive : ''}`}
          onClick={() => setFilterElement(null)}
        >
          {t('magicDecks.deckBuilder.all', 'All')}
        </button>
        {ALL_ELEMENTS.map(el => (
          <button
            key={el}
            className={`${styles.filterBtn} ${filterElement === el ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterElement(filterElement === el ? null : el)}
            style={{ borderColor: filterElement === el ? ELEMENT_COLORS[el] : undefined }}
          >
            {ELEMENT_ICONS[el]}
          </button>
        ))}
        <span style={{ opacity: 0.3 }}>|</span>
        {['creature', 'spell', 'hero'].map(type => (
          <button
            key={type}
            className={`${styles.filterBtn} ${filterType === type ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterType(filterType === type ? null : type)}
          >
            {t(`magicDecks.deckBuilder.${type}`, type)}
          </button>
        ))}
      </div>

      <div className={styles.deckBuilderLayout}>
        {/* Card pool */}
        <div className={styles.cardPool}>
          {availableCards.map(card => {
            const inDeck = deckCounts.get(card.id) || 0
            const owned = collectionCounts.get(card.id) || 0
            const disabled = inDeck >= MAX_COPIES_PER_CARD || inDeck >= owned || editDeck.cardIds.length >= DECK_MAX_SIZE
            return (
              <div
                key={card.id}
                className={`${styles.cardPoolCard} ${disabled ? styles.cardPoolCardDisabled : ''} ${inDeck > 0 ? styles.cardPoolCardSelected : ''}`}
                onClick={() => !disabled && addCard(card.id)}
                style={{ borderColor: inDeck > 0 ? ELEMENT_COLORS[card.element] : undefined }}
              >
                <img src={card.sprite} alt={card.name} className={styles.cardPoolSprite} loading="lazy" />
                <span className={styles.cardPoolName}>{card.name}</span>
                <span className={styles.cardPoolStats}>
                  {card.type === 'spell' ? `💫${card.spellEffect?.value ?? 0}` : `⚔${card.atk} 🛡${card.def}`} · ⚡{card.cost}
                </span>
                <span className={styles.cardPoolCount}>
                  {inDeck}/{owned} {ELEMENT_ICONS[card.element]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Deck sidebar */}
        <div className={styles.deckSidebar}>
          <div className={styles.deckInfo}>
            <input
              className={styles.deckNameInput}
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              placeholder={t('magicDecks.deckBuilder.deckName', 'Deck name...')}
            />
            <div className={styles.deckCount}>
              {editDeck.cardIds.length}/{DECK_MAX_SIZE} {t('magicDecks.deckBuilder.cards', 'cards')}
              {editDeck.cardIds.length < DECK_MIN_SIZE && (
                <span style={{ color: '#e74c3c', marginLeft: '0.3rem' }}>
                  ({t('magicDecks.deckBuilder.minCards', 'min {{min}}', { min: DECK_MIN_SIZE })})
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className={styles.ratingSection}>
            <div className={styles.ratingRow}>
              <span>{t('magicDecks.rating.synergy', 'Synergy')}</span>
              <span className={styles.ratingStars}>{renderStars(rating.synergy)}</span>
            </div>
            <div className={styles.ratingRow}>
              <span>{t('magicDecks.rating.curve', 'Curve')}</span>
              <span className={styles.ratingStars}>{renderStars(rating.curve)}</span>
            </div>
            <div className={styles.ratingRow}>
              <span>{t('magicDecks.rating.power', 'Power')}</span>
              <span className={styles.ratingStars}>{renderStars(rating.power)}</span>
            </div>
            <div className={styles.ratingOverall}>
              {t('magicDecks.rating.overall', 'Overall')}: {renderStars(rating.overall)} ({rating.overall.toFixed(1)})
            </div>
            {rating.tips.length > 0 && (
              <div className={styles.ratingTips}>
                {rating.tips.map((tip, i) => (
                  <div key={i}>💡 {t(tip, tip)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Deck card list */}
          <div className={styles.deckCardList}>
            {deckDisplay.map(({ def, count, indices }) => (
              <div
                key={def.id}
                className={styles.deckCardItem}
                onClick={() => removeCard(indices[indices.length - 1])}
                title={t('magicDecks.deckBuilder.clickToRemove', 'Click to remove')}
              >
                <span>
                  {ELEMENT_ICONS[def.element]} {def.name}
                  {count > 1 ? ` ×${count}` : ''}
                </span>
                <span style={{ opacity: 0.5 }}>⚡{def.cost}</span>
              </div>
            ))}
          </div>

          <button className={styles.saveDeckBtn} onClick={handleSave}>
            {t('magicDecks.deckBuilder.save', '💾 Save Deck')}
          </button>
        </div>
      </div>

      <button className={styles.menuBackBtn} onClick={onBack}>
        ← {t('miniGames.back', 'Back')}
      </button>
    </div>
  )
}
