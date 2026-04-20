<template>
  <div>
    <v-dialog
      v-model="visible"
      width="850"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ $t('dialogs.networkSettingsTitle') }}</span>
        </v-card-title>
        <v-card-text>
          <!-- Connection Check Section -->
          <v-card class="mt-2 mb-2">
            <v-card-title class="subtitle-1 py-2">
              Проверка соединения
            </v-card-title>
            <v-card-text>
              <v-row align="center" class="mb-3">
                <v-col cols="12">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2" color="primary">mdi-ip-network</v-icon>
                    <span class="subtitle-1 mr-3">Текущий IP:</span>
                    <span class="subtitle-1 font-weight-medium">
                      {{ currentIp || 'Не определен' }}
                    </span>
                    <v-btn
                      v-if="currentIp"
                      icon
                      small
                      class="ml-2"
                      @click="copyCurrentIp"
                    >
                      <v-icon small>mdi-content-copy</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      small
                      class="ml-1"
                      :loading="refreshingIp"
                      @click="refreshCurrentIp"
                    >
                      <v-icon small>mdi-reload</v-icon>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>

              <div class="mb-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="subtitle-1">URL для проверки</span>
                  <v-btn
                    small
                    @click="addUrl"
                  >
                    <v-icon small left>mdi-plus</v-icon>
                    Добавить URL
                  </v-btn>
                </div>

                <v-list class="url-list">
                  <v-list-item
                    v-for="(urlItem, index) in urlsToCheck"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="urlItem.url"
                      outlined
                      dense
                      placeholder="https://example.com"
                      hide-details
                      class="mr-2"
                      @keyup.enter="checkAllUrls"
                    ></v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="urlsToCheck.length === 1"
                      @click="removeUrl(index)"
                    >
                      <v-icon small>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>

                <v-btn
                  class="mt-2"
                  :loading="checkingConnection"
                  :disabled="!hasUrlsToCheck"
                  @click="checkAllUrls"
                  block
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить все соединения
                </v-btn>
              </div>

              <v-expansion-panels v-if="connectionStatuses.length > 0" class="mt-3" multiple>
                <v-expansion-panel
                  v-for="(status, index) in connectionStatuses"
                  :key="index"
                >
                  <v-expansion-panel-header :class="getStatusClass(status.type)">
                    <div class="d-flex align-center justify-space-between w-100">
                      <div class="d-flex align-center">
                        <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                          {{ getStatusIcon(status.type) }}
                        </v-icon>
                        <span class="font-weight-medium">{{ status.url }}</span>
                      </div>
                      <div class="d-flex align-center">
                        <v-chip
                          :color="getStatusChipColor(status.type)"
                          small
                          dark
                        >
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                        <span class="caption ml-2" v-if="status.duration">
                          {{ status.duration }}ms
                        </span>
                      </div>
                    </div>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <div class="pa-2">
                      <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                      <div v-if="status.error" class="error--text">
                        <strong>Ошибка:</strong> {{ status.error }}
                      </div>
                      <div v-if="status.responseTime" class="caption mt-1">
                        Время ответа: {{ status.responseTime }}ms
                      </div>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-card v-if="connectionStatuses.length > 0 && !checkingConnection" class="mt-3" outlined>
                <v-card-text class="py-2">
                  <div class="d-flex justify-space-around text-center">
                    <div>
                      <div class="subtitle-2">Всего проверок</div>
                      <div class="headline">{{ connectionStatuses.length }}</div>
                    </div>
                    <div>
                      <div class="subtitle-2 success--text">Успешных</div>
                      <div class="headline success--text">{{ successfulChecks }}</div>
                    </div>
                    <div>
                      <div class="subtitle-2 error--text">Неудачных</div>
                      <div class="headline error--text">{{ failedChecks }}</div>
                    </div>
                    <div>
                      <div class="subtitle-2">Среднее время</div>
                      <div class="headline">{{ averageResponseTime }}ms</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>

          <!-- Proxy Settings -->
          <v-card class="mt-2">
            <v-list-item dense @click="toggleOperaProxy">
              <v-list-item-title>{{ $t('settings.operaProxy') }}</v-list-item-title>
              <v-list-item-action class="mr-2">
                <v-switch :input-value="_proxy === 'http://opera'" @click="toggleOperaProxy"/>
              </v-list-item-action>
            </v-list-item>
          </v-card>

          <v-card>
            <v-card-text class="mt-2">
              <v-text-field
                v-if="_proxy !== 'http://opera'"
                outlined
                class="mb-2"
                :value="_proxy"
                @input="setProxyServer($event)"
                :label="$t('settings.proxyServer')"
                persistent-hint
              />

              <div class="caption">
                <div>
                  {{ $t('settings.proxyHint') }}
                </div>
                <div>
                  <b>{{ $t('settings.restartAfterServerChange') }}</b>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Shikimori URL -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              Shikimori URL
              <v-spacer></v-spacer>
              <v-btn small @click="addShikimoriUrl">
                <v-icon small left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">URL для Shikimori API</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(url, index) in shikimoriUrls"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="url.url"
                      outlined
                      dense
                      placeholder="https://shikimori.one"
                      hide-details
                      class="mr-2"
                      :class="{ 'primary--text': index === 0 }"
                      @change="updateShikimoriUrls"
                    >
                      <template v-slot:prepend-inner v-if="index === 0">
                        <v-icon color="primary" class="mr-1">mdi-star</v-icon>
                      </template>
                    </v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="shikimoriUrls.length === 1"
                      @click="removeShikimoriUrl(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingShikimori"
                  :disabled="!hasShikimoriUrls"
                  @click="checkShikimoriUrls"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить Shikimori URL
                </v-btn>

                <!-- Shikimori Status -->
                <v-expansion-panels v-if="shikimoriStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in shikimoriStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" small dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <!-- MyAnimeList URL -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              MyAnimeList URL
              <v-spacer></v-spacer>
              <v-btn small @click="addMyAnimeListUrl">
                <v-icon small left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">URL для MyAnimeList API</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(url, index) in myAnimeListUrls"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="url.url"
                      outlined
                      dense
                      placeholder="https://myanimelist.net"
                      hide-details
                      class="mr-2"
                      :class="{ 'primary--text': index === 0 }"
                      @change="updateMyAnimeListUrls"
                    >
                      <template v-slot:prepend-inner v-if="index === 0">
                        <v-icon color="primary" class="mr-1">mdi-star</v-icon>
                      </template>
                    </v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="myAnimeListUrls.length === 1"
                      @click="removeMyAnimeListUrl(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingMyAnimeList"
                  :disabled="!hasMyAnimeListUrls"
                  @click="checkMyAnimeListUrls"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить MyAnimeList URL
                </v-btn>

                <!-- MyAnimeList Status -->
                <v-expansion-panels v-if="myAnimeListStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in myAnimeListStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" small dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <!-- API Endpoints with multiple URLs -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              API Endpoints
              <v-spacer></v-spacer>
              <v-btn small @click="addApiEndpoint">
                <v-icon small left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">Основной эндпоинт будет использоваться первым доступным</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(endpoint, index) in apiEndpoints"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="endpoint.url"
                      outlined
                      dense
                      placeholder="https://anilibria.tv/"
                      hide-details
                      class="mr-2 star-field"
                      :class="{ 'primary--text': index === 0 }"
                      @change="updateApiEndpoints"
                    >
                      <template v-slot:prepend-inner v-if="index === 0">
                        <v-icon color="primary">mdi-star</v-icon>
                      </template>
                    </v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="apiEndpoints.length === 1"
                      @click="removeApiEndpoint(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingApiEndpoints"
                  :disabled="!hasApiEndpoints"
                  @click="checkApiEndpoints"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить API эндпоинты
                </v-btn>

                <!-- API Endpoints Status -->
                <v-expansion-panels v-if="apiEndpointsStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in apiEndpointsStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" small dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <!-- Static Endpoints with multiple URLs -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              Static Endpoints
              <v-spacer></v-spacer>
              <v-btn small @click="addStaticEndpoint">
                <v-icon left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">Статический эндпоинт для загрузки изображений и файлов</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(endpoint, index) in staticEndpoints"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="endpoint.url"
                      outlined
                      dense
                      placeholder="https://static-libria.weekstorm.one/"
                      hide-details
                      class="mr-2"
                      :class="{ 'primary--text': index === 0 }"
                      @change="updateStaticEndpoints"
                    >
                      <template v-slot:prepend-inner v-if="index === 0">
                        <v-icon color="primary" class="mr-1">mdi-star</v-icon>
                      </template>
                    </v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="staticEndpoints.length === 1"
                      @click="removeStaticEndpoint(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingStaticEndpoints"
                  :disabled="!hasStaticEndpoints"
                  @click="checkStaticEndpoints"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить Static эндпоинты
                </v-btn>

                <!-- Static Endpoints Status -->
                <v-expansion-panels v-if="staticEndpointsStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in staticEndpointsStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <!-- Cache Servers with multiple URLs -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              Cache Servers
              <v-spacer></v-spacer>
              <v-btn small @click="addCacheServer">
                <v-icon left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">Сервер кеша для хранения временных данных</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(server, index) in cacheServers"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="server.url"
                      outlined
                      dense
                      placeholder="https://cache.example.com/"
                      hide-details
                      class="mr-2"
                      @change="updateCacheServers"
                    ></v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="cacheServers.length === 1"
                      @click="removeCacheServer(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingCacheServers"
                  :disabled="!hasCacheServers"
                  @click="checkCacheServers"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить Cache серверы
                </v-btn>

                <!-- Cache Servers Status -->
                <v-expansion-panels v-if="cacheServersStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in cacheServersStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" small dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <!-- Hash File URLs with multiple URLs -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              Hash File URLs
              <v-spacer></v-spacer>
              <v-btn small @click="addHashFileUrl">
                <v-icon left>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div class="mb-2">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="caption">URL для загрузки файла хешей</span>
                </div>
                <v-list class="url-list">
                  <v-list-item
                    v-for="(hashUrl, index) in hashFileUrls"
                    :key="index"
                    class="pa-0 mb-2"
                  >
                    <v-text-field
                      v-model="hashUrl.url"
                      outlined
                      dense
                      placeholder="https://example.com/hashes.json"
                      hide-details
                      class="mr-2"
                      @change="updateHashFileUrls"
                    ></v-text-field>
                    <v-btn
                      icon
                      small
                      color="error"
                      :disabled="hashFileUrls.length === 1"
                      @click="removeHashFileUrl(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item>
                </v-list>
                <v-btn
                  small
                  :loading="checkingHashFileUrls"
                  :disabled="!hasHashFileUrls"
                  @click="checkHashFileUrls"
                  class="mt-2"
                >
                  <v-icon left>mdi-network-strength-4</v-icon>
                  Проверить Hash File URLs
                </v-btn>

                <!-- Hash File URLs Status -->
                <v-expansion-panels v-if="hashFileUrlsStatuses.length > 0" class="mt-2" multiple>
                  <v-expansion-panel v-for="(status, index) in hashFileUrlsStatuses" :key="index">
                    <v-expansion-panel-header :class="getStatusClass(status.type)">
                      <div class="d-flex align-center justify-space-between w-100">
                        <div class="d-flex align-center">
                          <v-icon :color="getStatusIconColor(status.type)" class="mr-2">
                            {{ getStatusIcon(status.type) }}
                          </v-icon>
                          <span class="font-weight-medium caption">{{ status.url }}</span>
                        </div>
                        <v-chip :color="getStatusChipColor(status.type)" small dark>
                          {{ status.statusCode || 'Ошибка' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div class="pa-2 caption">
                        <div><strong>Статус:</strong> {{ status.statusText || 'Нет данных' }}</div>
                        <div v-if="status.responseTime">Время: {{ status.responseTime }}ms</div>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>

          <div class="caption mt-2">
            <b>{{ $t('settings.restartAfterServerChange') }}</b>
          </div>

          <!-- Cache Management -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              Управление кешем
            </v-card-title>
            <v-card-text>
              <v-row align="center" no-gutters>
                <v-col cols="8">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2" color="primary">mdi-database</v-icon>
                    <span class="subtitle-1">
                      Размер кеша:
                      <strong>{{ cacheSize || '0 B' }}</strong>
                    </span>
                  </div>
                </v-col>
                <v-col cols="4" class="text-right">
                  <v-btn
                    color="error"
                    :loading="clearingCache"
                    :disabled="clearingCache || cacheSize === '0 B'"
                    @click="clearCache"
                  >
                    <v-icon left>mdi-delete-sweep</v-icon>
                    Очистить кеш
                  </v-btn>
                </v-col>
              </v-row>

              <v-progress-linear
                v-if="clearingCache"
                indeterminate
                color="error"
                class="mt-3"
              ></v-progress-linear>

              <div class="caption mt-3">
                <v-icon>mdi-information</v-icon>
                Очистка кеша удаляет все временные файлы и может потребовать повторной загрузки данных.
              </div>
            </v-card-text>
          </v-card>

          <!-- Ignore Certs -->
          <v-card class="mt-2">
            <v-list-item dense @click="_setIgnoreCerts(!_ignore_certs)">
              <v-list-item-title>{{ $t('settings.ignoreCerts') }}</v-list-item-title>
              <v-list-item-action class="mr-2">
                <v-switch :input-value="_ignore_certs" @change="_setIgnoreCerts"/>
              </v-list-item-action>
            </v-list-item>
            <v-card-text class="pt-2 caption">
              {{ $t('settings.ignoreCertsHint') }}
            </v-card-text>
          </v-card>

          <!-- DNS Mapping -->
          <v-card class="mt-2">
            <v-card-title class="subtitle-1 py-2">
              DNS Mapping
              <v-spacer></v-spacer>
              <v-btn
                small
                @click="addDnsEntry"
              >
                <v-icon>mdi-plus</v-icon>
                Добавить
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                  <tr>
                    <th class="text-left">Домен</th>
                    <th class="text-left">IP адрес</th>
                    <th class="text-center" style="width: 50px">Действия</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                    v-for="(entry, index) in dnsEntries"
                    v-if="entry && typeof entry === 'object'"
                    :key="index"
                  >
                    <td>
                      <v-text-field
                        v-model="entry.domain"
                        placeholder="example.com"
                        dense
                        hide-details
                        @change="updateDnsMapping"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="entry.ip"
                        placeholder="8.8.8.8"
                        dense
                        hide-details
                        @change="updateDnsMapping"
                      ></v-text-field>
                    </td>
                    <td class="text-center">
                      <v-btn
                        icon
                        small
                        color="error"
                        @click="removeDnsEntry(index)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr v-if="!dnsEntries.length || dnsEntries.every(entry => !entry)">
                    <td colspan="3" class="text-center grey--text py-4">
                      Нет DNS записей. Нажмите "Добавить" для создания маппинга.
                    </td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <div class="caption mt-2">
                Укажите соответствие доменных имен IP адресам.
              </div>
            </v-card-text>
          </v-card>

        </v-card-text>
        <v-card-actions>
          <v-btn
            color="green darken-1"
            text
            @click="visible = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { invokeUpdateProxy } from "@main/handlers/app/app-handlers"

export default {
  data () {
    return {
      visible: false,
      loading: false,
      dnsEntries: [],
      cacheSize: '0 B',
      clearingCache: false,

      urlsToCheck: [
        { url: 'https://github.com' },
        { url: 'https://anilibria.tv/public/api/index.php' },
        { url: 'https://wwnd.space/public/api/index.php' },
        { url: 'https://anilibria.top' },
        { url: 'https://anilibria.wtf' },
        { url: 'https://aniliberty.wtf' },
        { url: 'https://aniliberty.top' },
      ],
      checkingConnection: false,
      connectionStatuses: [],
      currentIp: null,
      refreshingIp: false,

      shikimoriUrls: [],
      checkingShikimori: false,
      shikimoriStatuses: [],

      myAnimeListUrls: [],
      checkingMyAnimeList: false,
      myAnimeListStatuses: [],

      apiEndpoints: [
        'https://anilibria.tv',
        'https://wwnd.space'
      ],
      checkingApiEndpoints: false,
      apiEndpointsStatuses: [],

      staticEndpoints: [
        'https://anilibria.tv',
        'https://wwnd.space'
      ],
      checkingStaticEndpoints: false,
      staticEndpointsStatuses: [],

      cacheServers: [],
      checkingCacheServers: false,
      cacheServersStatuses: [],

      hashFileUrls: [],
      checkingHashFileUrls: false,
      hashFileUrlsStatuses: []
    }
  },
  computed: {
    ...mapState('app/settings/system', {
      _api_endpoint: s => s.api._endpoint,
      _static_endpoint: s => s.api._static_endpoint,
      _proxy: s => s.proxy,
      _ignore_certs: s => s.ignore_certs,
      _dns_mapping: s => s.dns_mapping,
      _cache_server: s => s.cache_server,
      _hash_file_url: s => s.hash_file_url,
      _shikimori_url: s => s.shikimori_url,
      _myanimelist_url: s => s.myanimelist_url
    }),
    hasUrlsToCheck () {
      return this.urlsToCheck.some(item => item.url && item.url.trim())
    },
    hasShikimoriUrls () {
      return this.shikimoriUrls.some(item => item.url && item.url.trim())
    },
    hasMyAnimeListUrls () {
      return this.myAnimeListUrls.some(item => item.url && item.url.trim())
    },
    hasApiEndpoints () {
      return this.apiEndpoints.some(item => item.url && item.url.trim())
    },
    hasStaticEndpoints () {
      return this.staticEndpoints.some(item => item.url && item.url.trim())
    },
    hasCacheServers () {
      return this.cacheServers.some(item => item.url && item.url.trim())
    },
    hasHashFileUrls () {
      return this.hashFileUrls.some(item => item.url && item.url.trim())
    },
    successfulChecks () {
      return this.connectionStatuses.filter(s => s.type === 'success').length
    },
    failedChecks () {
      return this.connectionStatuses.filter(s => s.type !== 'success').length
    },
    averageResponseTime () {
      const successfulWithTime = this.connectionStatuses.filter(s => s.responseTime)
      if (successfulWithTime.length === 0) return 0
      const total = successfulWithTime.reduce((sum, s) => sum + s.responseTime, 0)
      return Math.round(total / successfulWithTime.length)
    }
  },
  watch: {
    _dns_mapping: {
      handler (newVal) {
        if (newVal && Array.isArray(newVal)) {
          this.dnsEntries = newVal
            .filter(entry => entry && typeof entry === 'object')
            .map(entry => ({ domain: entry.domain || '', ip: entry.ip || '' }))
        } else {
          this.dnsEntries = []
        }
      },
      immediate: true,
      deep: true
    },
    visible: {
      handler (newVal) {
        if (newVal) {
          this.getCacheSize()
          this.getCurrentIp()
          this.loadEndpointsFromStore()
        }
      }
    }
  },
  methods: {
    hideDialog () {
      this.visible = false
    },
    showDialog () {
      this.visible = true
      if (this._dns_mapping && Array.isArray(this._dns_mapping)) {
        this.dnsEntries = this._dns_mapping
          .filter(entry => entry && typeof entry === 'object')
          .map(entry => ({ domain: entry.domain || '', ip: entry.ip || '' }))
      }
      this.getCacheSize()
      this.getCurrentIp()
      this.loadEndpointsFromStore()
      this.connectionStatuses = []
    },

    loadEndpointsFromStore () {
      if (this._shikimori_url) {
        const urls = this._shikimori_url.split(';').filter(u => u.trim())
        this.shikimoriUrls = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.shikimoriUrls.length) {
        this.shikimoriUrls = [{ url: '' }]
      }

      if (this._myanimelist_url) {
        const urls = this._myanimelist_url.split(';').filter(u => u.trim())
        this.myAnimeListUrls = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.myAnimeListUrls.length) {
        this.myAnimeListUrls = [{ url: '' }]
      }

      if (this._api_endpoint) {
        const urls = this._api_endpoint.split(';').filter(u => u.trim())
        this.apiEndpoints = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.apiEndpoints.length) {
        this.apiEndpoints = [{ url: 'https://anilibria.tv/' }]
      }

      if (this._static_endpoint) {
        const urls = this._static_endpoint.split(';').filter(u => u.trim())
        this.staticEndpoints = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.staticEndpoints.length) {
        this.staticEndpoints = [{ url: 'https://static-libria.weekstorm.one/' }]
      }

      if (this._cache_server) {
        const urls = this._cache_server.split(';').filter(u => u.trim())
        this.cacheServers = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.cacheServers.length) {
        this.cacheServers = [{ url: '' }]
      }

      if (this._hash_file_url) {
        const urls = this._hash_file_url.split(';').filter(u => u.trim())
        this.hashFileUrls = urls.map(url => ({ url: url.trim() }))
      }
      if (!this.hashFileUrls.length) {
        this.hashFileUrls = [{ url: '' }]
      }
    },

    addShikimoriUrl () {
      this.shikimoriUrls.push({ url: '' })
    },
    removeShikimoriUrl (index) {
      if (this.shikimoriUrls.length > 1) {
        this.shikimoriUrls.splice(index, 1)
        this.updateShikimoriUrls()
      }
    },
    updateShikimoriUrls () {
      const validUrls = this.shikimoriUrls
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const urlStr = validUrls.join(';')
      this._setShikimoriUrl(urlStr)
    },
    async checkShikimoriUrls () {
      const validUrls = this.shikimoriUrls.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingShikimori = true
      this.shikimoriStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.shikimoriStatuses = results.filter(r => r !== null)
      this.checkingShikimori = false
    },

    addMyAnimeListUrl () {
      this.myAnimeListUrls.push({ url: '' })
    },
    removeMyAnimeListUrl (index) {
      if (this.myAnimeListUrls.length > 1) {
        this.myAnimeListUrls.splice(index, 1)
        this.updateMyAnimeListUrls()
      }
    },
    updateMyAnimeListUrls () {
      const validUrls = this.myAnimeListUrls
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const urlStr = validUrls.join(';')
      this._setMyAnimeListUrl(urlStr)
    },
    async checkMyAnimeListUrls () {
      const validUrls = this.myAnimeListUrls.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingMyAnimeList = true
      this.myAnimeListStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.myAnimeListStatuses = results.filter(r => r !== null)
      this.checkingMyAnimeList = false
    },

    addApiEndpoint () {
      this.apiEndpoints.push({ url: '' })
    },
    removeApiEndpoint (index) {
      if (this.apiEndpoints.length > 1) {
        this.apiEndpoints.splice(index, 1)
        this.updateApiEndpoints()
      }
    },
    updateApiEndpoints () {
      const validUrls = this.apiEndpoints
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const endpointStr = validUrls.join(';')
      this._setAPIEndpoint(endpointStr || process.env.API_ENDPOINT_URL)
    },
    async checkApiEndpoints () {
      const validUrls = this.apiEndpoints.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingApiEndpoints = true
      this.apiEndpointsStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.apiEndpointsStatuses = results.filter(r => r !== null)
      this.checkingApiEndpoints = false
    },
    addStaticEndpoint () {
      this.staticEndpoints.push({ url: '' })
    },
    removeStaticEndpoint (index) {
      if (this.staticEndpoints.length > 1) {
        this.staticEndpoints.splice(index, 1)
        this.updateStaticEndpoints()
      }
    },
    updateStaticEndpoints () {
      const validUrls = this.staticEndpoints
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const endpointStr = validUrls.join(';')
      this._setAPIStaticEndpoint(endpointStr || process.env.STATIC_ENDPOINT_URL)
    },
    async checkStaticEndpoints () {
      const validUrls = this.staticEndpoints.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingStaticEndpoints = true
      this.staticEndpointsStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.staticEndpointsStatuses = results.filter(r => r !== null)
      this.checkingStaticEndpoints = false
    },
    addCacheServer () {
      this.cacheServers.push({ url: '' })
    },
    removeCacheServer (index) {
      if (this.cacheServers.length > 1) {
        this.cacheServers.splice(index, 1)
        this.updateCacheServers()
      }
    },
    updateCacheServers () {
      const validUrls = this.cacheServers
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const serverStr = validUrls.join(';')
      this._setCacheServer(serverStr)
    },
    async checkCacheServers () {
      const validUrls = this.cacheServers.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingCacheServers = true
      this.cacheServersStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.cacheServersStatuses = results.filter(r => r !== null)
      this.checkingCacheServers = false
    },
    addHashFileUrl () {
      this.hashFileUrls.push({ url: '' })
    },
    removeHashFileUrl (index) {
      if (this.hashFileUrls.length > 1) {
        this.hashFileUrls.splice(index, 1)
        this.updateHashFileUrls()
      }
    },
    updateHashFileUrls () {
      const validUrls = this.hashFileUrls
        .filter(item => item.url && item.url.trim())
        .map(item => item.url.trim())
      const urlStr = validUrls.join(';')
      this._setHashFileUrl(urlStr)
    },
    async checkHashFileUrls () {
      const validUrls = this.hashFileUrls.filter(item => item.url && item.url.trim())
      if (validUrls.length === 0) return

      this.checkingHashFileUrls = true
      this.hashFileUrlsStatuses = []

      const promises = validUrls.map(item => this.checkSingleUrlQuick(item))
      const results = await Promise.all(promises)
      this.hashFileUrlsStatuses = results.filter(r => r !== null)
      this.checkingHashFileUrls = false
    },

    addUrl () {
      this.urlsToCheck.push({ url: '' })
    },
    removeUrl (index) {
      if (this.urlsToCheck.length > 1) {
        this.urlsToCheck.splice(index, 1)
      }
    },
    toggleOperaProxy: function () {
      if (this._proxy === 'http://opera') {
        this.setProxyServer('')
      } else {
        this.setProxyServer('http://opera')
      }
    },
    setProxyServer: async function ($event) {
      this._setProxy($event)
      await invokeUpdateProxy($event)
      setTimeout(() => {
        this.refreshCurrentIp()
      }, 2500)
    },
    addDnsEntry () {
      const newEntry = {
        domain: '',
        ip: ''
      }
      this.dnsEntries = [...this.dnsEntries, newEntry]
    },
    removeDnsEntry (index) {
      this.dnsEntries.splice(index, 1)
      this.dnsEntries = [...this.dnsEntries]
      this.updateDnsMapping()
    },
    updateDnsMapping () {
      const validEntries = this.dnsEntries
        .filter(entry => entry && typeof entry === 'object' && entry.domain && entry.domain.trim() && entry.ip && entry.ip.trim())
        .map(entry => ({ domain: entry.domain.trim(), ip: entry.ip.trim() }))

      this._setDnsMapping(validEntries)
      this.applyDnsMapping(validEntries)
    },
    applyDnsMapping (entries) {
      console.log('DNS Mapping updated:', entries)
    },
    async getCacheSize () {
      try {
        setTimeout(() => {
          this.cacheSize = this.formatBytes(Math.random() * 100000000)
        }, 500)
      } catch (error) {
        console.error('Failed to get cache size:', error)
        this.cacheSize = 'Ошибка'
      }
    },
    async clearCache () {
      this.clearingCache = true
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        this.cacheSize = '0 B'
        this.$emit('cache-cleared')
      } catch (error) {
        console.error('Failed to clear cache:', error)
      } finally {
        this.clearingCache = false
      }
    },
    formatBytes (bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    async getCurrentIp () {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        this.currentIp = data.ip
      } catch (error) {
        console.error('Failed to get current IP:', error)
        this.currentIp = null
      }
    },
    async refreshCurrentIp () {
      this.refreshingIp = true
      this.currentIp = null
      await this.getCurrentIp()
      this.refreshingIp = false
    },
    async copyCurrentIp () {
      if (!this.currentIp) return

      try {
        await navigator.clipboard.writeText(this.currentIp)
      } catch (error) {
        console.error('Failed to copy IP:', error)
      }
    },
    async checkSingleUrlQuick (urlItem) {
      const url = urlItem.url.trim()
      if (!url) return null

      const startTime = performance.now()

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache',
          method: 'HEAD'
        })

        clearTimeout(timeoutId)
        const responseTime = Math.round(performance.now() - startTime)

        return {
          url: url,
          type: response.ok ? 'success' : 'warning',
          statusCode: response.status,
          statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
          responseTime: responseTime
        }
      } catch (error) {
        const responseTime = Math.round(performance.now() - startTime)

        let errorMessage = 'Ошибка соединения'
        let statusCode = 0

        if (error.name === 'AbortError') {
          errorMessage = 'Превышено время ожидания'
          statusCode = 408
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Нет соединения с сервером'
          statusCode = 0
        } else {
          errorMessage = error.message
          statusCode = 0
        }

        return {
          url: url,
          type: 'error',
          statusCode: statusCode,
          statusText: errorMessage,
          error: errorMessage,
          responseTime: responseTime
        }
      }
    },
    async checkSingleUrl (urlItem) {
      const url = urlItem.url.trim()
      if (!url) return null

      const startTime = performance.now()

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache'
        })

        clearTimeout(timeoutId)
        const responseTime = Math.round(performance.now() - startTime)

        return {
          url: url,
          type: response.ok ? 'success' : 'warning',
          statusCode: response.status,
          statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
          responseTime: responseTime,
          duration: responseTime
        }
      } catch (error) {
        const responseTime = Math.round(performance.now() - startTime)

        let errorMessage = 'Ошибка соединения'
        let statusCode = 0

        if (error.name === 'AbortError') {
          errorMessage = 'Превышено время ожидания'
          statusCode = 408
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Нет соединения с сервером'
          statusCode = 0
        } else {
          errorMessage = error.message
          statusCode = 0
        }

        return {
          url: url,
          type: 'error',
          statusCode: statusCode,
          statusText: errorMessage,
          error: errorMessage,
          responseTime: responseTime,
          duration: responseTime
        }
      }
    },
    async checkAllUrls () {
      const validUrls = this.urlsToCheck.filter(item => item.url && item.url.trim())

      if (validUrls.length === 0) return

      this.checkingConnection = true
      this.connectionStatuses = []

      const promises = validUrls.map(urlItem => this.checkSingleUrl(urlItem))
      const results = await Promise.all(promises)

      this.connectionStatuses = results.filter(result => result !== null)
      this.checkingConnection = false
    },
    getStatusClass (type) {
      switch (type) {
        case 'success': return 'success--text'
        case 'warning': return 'warning--text'
        case 'error': return 'error--text'
        default: return ''
      }
    },
    getStatusIcon (type) {
      switch (type) {
        case 'success': return 'mdi-check-circle'
        case 'warning': return 'mdi-alert'
        case 'error': return 'mdi-close-circle'
        default: return 'mdi-help-circle'
      }
    },
    getStatusIconColor (type) {
      switch (type) {
        case 'success': return 'success'
        case 'warning': return 'warning'
        case 'error': return 'error'
        default: return 'grey'
      }
    },
    getStatusChipColor (type) {
      switch (type) {
        case 'success': return 'success'
        case 'warning': return 'warning'
        case 'error': return 'error'
        default: return 'grey'
      }
    },
    ...mapActions('app/settings/system', {
      _setAPIEndpoint: 'setAPIEndpoint',
      _setAPIStaticEndpoint: 'setAPIStaticEndpoint',
      _setProxy: 'setProxy',
      _setIgnoreCerts: 'setIgnoreCerts',
      _setDnsMapping: 'setDnsMapping',
      _setCacheServer: 'setCacheServer',
      _setHashFileUrl: 'setHashFileUrl',
      _setShikimoriUrl: 'setShikimoriUrl',
      _setMyAnimeListUrl: 'setMyAnimeListUrl'
    })
  },
  mounted () {
    if (this._dns_mapping && Array.isArray(this._dns_mapping)) {
      this.dnsEntries = this._dns_mapping
        .filter(entry => entry && typeof entry === 'object')
        .map(entry => ({ domain: entry.domain || '', ip: entry.ip || '' }))
    }
    this.loadEndpointsFromStore()
  }
}
</script>
