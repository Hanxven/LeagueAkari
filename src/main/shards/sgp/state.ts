import { makeAutoObservable } from "mobx";

export class SgpState {
  constructor() {
    makeAutoObservable(this)
  }
}