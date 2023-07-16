<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Ref } from 'vue';

const props = defineProps<{
  score: number
}>()
let showFront:Ref<boolean> = ref(false);
let frontContent:Ref<number> = ref(0);
let backContent:Ref<number> = ref(0);

// when score is changed set the non-showing card the newScore.
watch(() => props.score, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (showFront.value) {
      backContent.value = newVal;
    } else {
      frontContent.value = newVal;
    }
    showFront.value = !showFront.value;
  }
});

</script>

<template>
  <div :class="['card-container', showFront ? '' : 'flipped']">
    <section class="card front">
      {{ frontContent }}
    </section>
    <section class="card back">
      {{ backContent }}
    </section>
  </div>
</template>

<style scoped>
.card-container {
  position: relative;
/* ideally this timing function would be an animation with spring phy */
  transition: transform 0.7s ease-in-out;
  transform: perspective(500px);
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  height: 1.8em;
}

.card {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid #555;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  backface-visibility: hidden;
  box-sizing: border-box;
  /* box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25); */
}

.front, .back {
  background-color: white;
}

.back {
  transform: rotateY(180deg);
}

.flipped {
  transform: rotateY(180deg);
}

.hidden {
  display: none;
}
</style>