<!--
 * @Author: v3-vite-test 876023825@qq.com
 * @Date: 2023-05-25 09:44:15
 * @LastEditors: v3-vite-test 876023825@qq.com
 * @LastEditTime: 2023-09-15 17:42:05
 * @FilePath: \ele-h5\src\views\tabs\home\components\TheTransformer.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import type { ITransformer } from '@/types'

interface IProps {
  data: ITransformer[]
}
defineProps<IProps>()
</script>

<template>
  <div class="home-transformer">
    <div v-for="v in data" :key="v.label" class="home-transformer__item">
      <img :src="v.imgUrl" />
      <div>{{ v.label }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-transformer {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin-top:10px;
  padding:0 10px;
  &__item {
    font-size: 13px;
    line-height: 15px;
    text-align: center;

    img {
      width: 48px;
    }
  }
}
</style>
