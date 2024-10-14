import { makeAutoObservable } from "mobx";

export class OpggState {
  constructor() {
    makeAutoObservable(this)
  }
}