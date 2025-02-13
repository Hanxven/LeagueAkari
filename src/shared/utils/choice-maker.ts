export class ChoiceMaker<T = any> {
  private cumulativeWeights: number[]

  constructor(
    private weights: number[],
    private choices: T[]
  ) {
    if (weights.length !== choices.length || weights.length === 0) {
      throw new Error('Weights and choices arrays should have the same length and not be empty')
    }

    this.cumulativeWeights = this.computeCumulativeWeights(weights)
  }

  private computeCumulativeWeights(weights: number[]): number[] {
    const cumulativeWeights: number[] = []
    weights.reduce((acc, cur, index) => {
      const newAcc = acc + cur
      cumulativeWeights[index] = newAcc
      return newAcc
    }, 0)
    return cumulativeWeights
  }

  private chooseIndexFromWeights(cumulativeWeights: number[]): number {
    const totalWeight = cumulativeWeights[cumulativeWeights.length - 1]
    const randomValue = Math.random() * totalWeight

    let left = 0
    let right = cumulativeWeights.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (cumulativeWeights[mid] === randomValue) {
        return mid
      } else if (cumulativeWeights[mid] < randomValue) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
    return left
  }

  chooseIndex(): number {
    return this.chooseIndexFromWeights(this.cumulativeWeights)
  }

  chooseOne(): T {
    return this.choices[this.chooseIndex()]
  }

  choose(count: number): T[] {
    const selectedIndices = this.chooseIndexes(count)
    return selectedIndices.map((index) => this.choices[index])
  }

  chooseIndexes(count: number): number[] {
    if (count > this.choices.length) {
      throw new Error('Count cannot exceed the number of choices')
    }

    if (count === 1) {
      return [this.chooseIndex()]
    }

    if (count === 0) {
      return []
    }

    if (count === this.choices.length) {
      return this.choices.map((_, index) => index)
    }

    const selectedIndices: number[] = []
    const remainingWeights = this.weights.slice()
    const remainingIndices = this.choices.map((_, index) => index)

    for (let i = 0; i < count; i++) {
      const cumulativeWeights = this.computeCumulativeWeights(remainingWeights)
      const chosenIndexInRemaining = this.chooseIndexFromWeights(cumulativeWeights)

      const chosenIndex = remainingIndices[chosenIndexInRemaining]
      selectedIndices.push(chosenIndex)

      // Remove selected item
      remainingWeights.splice(chosenIndexInRemaining, 1)
      remainingIndices.splice(chosenIndexInRemaining, 1)
    }

    // Sort indices to maintain original order
    selectedIndices.sort((a, b) => a - b)

    return selectedIndices
  }
}
