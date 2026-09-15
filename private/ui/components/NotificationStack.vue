<script setup>
import { notifications } from "../notifications.js";
</script>

<template>
    <TransitionGroup name="notification" tag="div" class="notification-stack">
        <div
            v-for="notification in notifications"
            :key="notification.id"
            class="game-notification"
            :style="{
                '--notification-color': notification.color,
                '--notification-text-color': notification.textColor,
                '--notification-duration': `${notification.duration}ms`,
            }"
        >
            <strong>{{ notification.message }}</strong>
            <span class="notification-timer" />
        </div>
    </TransitionGroup>
</template>
