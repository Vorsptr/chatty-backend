export class Helpers {
  static firstLetterUppercase(str: string): string {
    const valueString = str.toLowerCase();
    return valueString.charAt(0).toUpperCase() + valueString.slice(1);
  }
  static stringToLowerCase(string: string): string {
    return string.toLowerCase();
  }

  static generateRandomIntegers(integerLength: number): number {
    const characters = Array.from("0123456789");
    let result = "";
    for (let i = 0; i < integerLength; i++) {
      result += characters[Math.floor(Math.random() * characters.length)];
    }
    return parseInt(result, 10);
  }

  static parseJson(prop: string): any {
    try {
      JSON.parse(prop);
    } catch (error) {
      return prop;
    }
    return JSON.parse(prop);
  }
}
