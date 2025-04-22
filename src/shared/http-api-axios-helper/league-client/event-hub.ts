import {
  EventChapters,
  EventDetailsData,
  EventHubEvents,
  EventInfo,
  EventNarrativeButtonData,
  EventObjectivesBanner,
  EventPassBundle2,
  EventProgressInfoData,
  EventProgressionPurchaseData,
  EventRewardTrackBonusItem,
  EventRewardTrackBonusProgress,
  EventRewardTrackItem,
  EventRewardTrackUnclaimedRewards,
  EventRewardTrackXP
} from '@shared/types/league-client/event-hub'
import { AxiosInstance } from 'axios'

export class EventHubHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEvents() {
    return this._http.get<EventHubEvents[]>('/lol-event-hub/v1/events')
  }

  getChapters(eventId: string) {
    return this._http.get<EventChapters>(`/lol-event-hub/v1/events/${eventId}/chapters`)
  }

  getEventDetailsData(eventId: string) {
    return this._http.get<EventDetailsData>(
      `/lol-event-hub/v1/events/${eventId}/event-details-data`
    )
  }

  getInfo(eventId: string) {
    return this._http.get<EventInfo>(`/lol-event-hub/v1/events/${eventId}/info`)
  }

  getIsGracePeriod(eventId: string) {
    return this._http.get<boolean>(`/lol-event-hub/v1/events/${eventId}/is-grace-period`)
  }

  // TODO: Add type
  getNarrative(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/narrative`)
  }

  getObjectivesBanner(eventId: string) {
    return this._http.get<EventObjectivesBanner>(
      `/lol-event-hub/v1/events/${eventId}/objectives-banner`
    )
  }

  // TODO: Add type
  getPassBackgroundData(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/pass-background-data`)
  }

  getPassBundles(eventId: string) {
    return this._http.get<EventPassBundle2>(`/lol-event-hub/v1/events/${eventId}/pass-bundles`)
  }

  getProgressInfoData(eventId: string) {
    return this._http.get<EventProgressInfoData>(
      `/lol-event-hub/v1/events/${eventId}/progress-info-data`
    )
  }

  getProgressionPurchaseData(eventId: string) {
    return this._http.get<EventProgressionPurchaseData>(
      `/lol-event-hub/v1/events/${eventId}/progression-purchase-data`
    )
  }

  postPurchaseOffer(eventId: string, data: any) {
    return this._http.post(`/lol-event-hub/v1/events/${eventId}/purchase-offer`, data)
  }

  getRewardTrackBonusItems(eventId: string) {
    return this._http.get<EventRewardTrackBonusItem[]>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/bonus-items`
    )
  }

  getRewardTrackBonusProgress(eventId: string) {
    return this._http.get<EventRewardTrackBonusProgress>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/bonus-progress`
    )
  }

  postRewardTrackClaimAll(eventId: string) {
    return this._http.post<void>(`/lol-event-hub/v1/events/${eventId}/reward-track/claim-all`)
  }

  getRewardTrackCounter(eventId: string, beforeEpoch: number) {
    return this._http.get<number>(`/lol-event-hub/v1/events/${eventId}/reward-track/counter`, {
      params: { beforeEpoch }
    })
  }

  getRewardTrackFailure(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/reward-track/failure`)
  }

  getRewardTrackItems(eventId: string) {
    return this._http.get<EventRewardTrackItem[]>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/items`
    )
  }

  getRewardTrackProgress(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/reward-track/progress`)
  }

  getRewardTrackUnclaimedRewards(eventId: string) {
    return this._http.get<EventRewardTrackUnclaimedRewards>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/unclaimed-rewards`
    )
  }

  getRewardTrackXP(eventId: string) {
    return this._http.get<EventRewardTrackXP>(`/lol-event-hub/v1/events/${eventId}/reward-track/xp`)
  }

  // TODO: Add type
  getTokenShop(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop`)
  }

  // TODO: Add type
  getTokenShopCategoriesOffers(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop/categories-offers`)
  }

  // TODO: Add type
  getTokenShopTokenBalance(eventId: string) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop/token-balance`)
  }

  getNavigationButtonData() {
    return this._http.get<EventNarrativeButtonData>(`/lol-event-hub/v1/navigation-button-data`)
  }

  postPurchaseItem(data: any) {
    return this._http.post(`/lol-event-hub/v1/purchase-item`, data)
  }

  // TODO: Add type
  getSkins() {
    return this._http.get<{}>(`/lol-event-hub/v1/skins`)
  }

  // TODO: Add type
  getTokenUpsell() {
    return this._http.get<any[]>(`/lol-event-hub/v1/token-upsell`)
  }
}
