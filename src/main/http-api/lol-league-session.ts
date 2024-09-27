import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'

export function getLolLeagueSessionToken() {
  return lcm.lcuRequest<string>({
    method: 'GET',
    url: '/lol-league-session/v1/league-session-token'
  })
}
