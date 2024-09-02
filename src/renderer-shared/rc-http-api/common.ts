import axios from 'axios'

export const request = axios.create({
  baseURL: 'akari://rc',
  adapter: 'fetch'
})
