# NSFW Worker

A Worker that takes an image URL as input and checks to see if it is NSFW

If the image is indeed NSFW then you'll get back a response that has an image that looks something like this

![NSFW Image](https://placehold.co/400x400?text=NSFW)

If it is not NSFW then you'll just get back the original url

## Example request

```js

fetch(`https://nsfw-worker.omarmo.workers.dev/?secret=${APP_SECRET}&imageUrl=${IMAGE_URL}`)

```
