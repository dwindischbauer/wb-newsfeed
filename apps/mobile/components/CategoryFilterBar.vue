<template>
  <div class="pill-bar-container">
    <button 
      v-for="cat in categories" 
      :key="cat" 
      :class="['pill-btn', { active: selected === cat }]"
      @click="$emit('select', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur']
  },
  selected: {
    type: String,
    default: 'Alle'
  }
});

defineEmits(['select']);
</script>
