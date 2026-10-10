// Общая загрузка моделей face-api.js для верификации лица (регистрация + прохождение теста).
//
// tinyFaceDetector вместо ssdMobilenetv1: ~193 КБ вместо ~5.6 МБ при той же задаче
// (найти одно лицо в кадре) — на телефоне со слабым интернетом именно ssdMobilenetv1
// была основной причиной долгой загрузки/отправки.
//
// Промис загрузки держим в одном месте на весь модуль: если регистрация уже начала
// предзагрузку, а извлечение дескриптора вызывается чуть позже, второй вызов не
// запускает повторную параллельную загрузку тех же ~7 МБ — просто дожидается первой.

const MODEL_URL = "/face-models";

let loadPromise: Promise<typeof import("@vladmandic/face-api")> | null = null;

export function loadFaceApi() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    })().catch((e) => {
      loadPromise = null; // дать возможность повторить попытку при следующем вызове
      throw e;
    });
  }
  return loadPromise;
}
