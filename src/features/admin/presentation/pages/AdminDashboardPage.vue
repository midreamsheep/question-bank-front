<script setup lang="ts">
/**
 * @file Admin dashboard page: entry for operations overview.
 */
</script>

<template>
  <!-- Page: Admin dashboard -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">运营总览</h1>
      <p class="page__lead">管理内容、分类体系与每日一题。</p>
    </header>
    <div class="page__grid">
      <article class="card">
        <h2 class="card__title">题目审核</h2>
        <p class="card__text">审核提交内容并管理发布状态。</p>
      </article>
      <article class="card">
        <h2 class="card__title">每日一题</h2>
        <p class="card__text">选择、发布或撤销每日一题。</p>
      </article>
      <article class="card">
        <h2 class="card__title">分类体系</h2>
        <p class="card__text">维护分类、题型与标签。</p>
      </article>
    </div>
  </section>
</template>
