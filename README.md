# Stake Reader para Telegram

O **Stake Reader** é uma extensão de navegador que identifica stakes indicadas em `u` ou `%` nas mensagens do Telegram Web e calcula automaticamente o valor da entrada com base na banca e na gestão configuradas pelo usuário.

O projeto é gratuito, aberto e executa todos os cálculos localmente no navegador.

## Principais recursos

- Funciona em canais, grupos e conversas do Telegram Web.
- Reconhece stakes como `1u`, `1,5u`, `2 unidades` e `1,74%`.
- Permite configurar banca e quantidade de unidades da gestão.
- Permite interpretar `%` como percentual real ou como número de unidades.
- Exibe o cálculo sobre a imagem da aposta quando existe mídia.
- Usa truncamento em duas casas decimais para valores aceitos pelas casas de apostas.
- Não envia mensagens, banca ou histórico para servidores externos.

## Download

Baixe a versão mais recente na página **Releases** do repositório.

Após baixar o arquivo `.zip`, extraia-o antes de instalar. O Chrome e o Edge não carregam a extensão diretamente do arquivo compactado.

## Instalação no Google Chrome

1. Baixe o arquivo `.zip` da versão mais recente.
2. Clique com o botão direito no arquivo e escolha **Extrair tudo**.
3. Abra o Google Chrome.
4. Digite `chrome://extensions` na barra de endereços.
5. Ative **Modo do desenvolvedor**, no canto superior direito.
6. Clique em **Carregar sem compactação**.
7. Selecione a pasta extraída da extensão.
8. Fixe o Stake Reader na barra do navegador pelo menu de extensões.
9. Abra ou atualize o Telegram Web.

## Instalação no Microsoft Edge

1. Baixe e extraia o arquivo `.zip`.
2. Abra o Microsoft Edge.
3. Digite `edge://extensions` na barra de endereços.
4. Ative **Modo de desenvolvedor**.
5. Clique em **Carregar sem pacote** ou **Carregar sem compactação**.
6. Selecione a pasta extraída.
7. Abra ou atualize o Telegram Web.

## Como configurar

1. Clique no ícone do Stake Reader na barra do navegador.
2. Informe a sua banca atual.
3. Informe a quantidade total de unidades da gestão.
4. Escolha como stakes em `%` devem ser interpretadas:
   - **Usar o número como unidades:** `1,74%` será calculado como `1,74u`.
   - **Percentual real da banca:** `1,74%` será calculado diretamente sobre a banca.
5. Escolha a posição do indicador sobre a imagem.
6. Mantenha **Ativar no Telegram Web** ligado.
7. Clique em **Salvar configurações**.

### Exemplo de gestão

Com uma banca de **R$ 500,00** e gestão de **80u**:

```text
1u = R$ 500,00 ÷ 80
1u = R$ 6,25
```

Uma stake de `1,74u` será:

```text
1,74 × R$ 6,25 = R$ 10,875
Valor exibido: R$ 10,87
```

O valor é truncado para duas casas, sem arredondar para cima.

## Como usar no Telegram

1. Entre em `https://web.telegram.org/`.
2. Abra qualquer canal, grupo ou conversa que publique apostas.
3. Quando a extensão encontrar uma stake reconhecida, ela exibirá um botão sobre a imagem ou abaixo da mensagem.
4. Clique no botão da stake.
5. O valor calculado aparecerá ao lado.

Exemplo:

```text
💰 1u   Valor: R$ 6,25
```

## Formatos reconhecidos

Exemplos comuns:

```text
1u
1,5u
2 unidades
Stake: 0,75u
Entrada: 1,25%
🍎 1,74%
```

A extensão tenta evitar números que representem odd, linha, placar ou outras estatísticas.

## Atualização manual

Quando uma nova versão for publicada:

1. Baixe e extraia o novo arquivo `.zip`.
2. Abra `chrome://extensions` ou `edge://extensions`.
3. Remova a versão antiga ou substitua os arquivos da pasta anterior.
4. Carregue a nova pasta sem compactação.
5. Atualize o Telegram Web com `Ctrl + F5`.

## Solução de problemas

### A stake não foi reconhecida

O canal pode utilizar um formato ainda não contemplado. Abra uma issue e envie um exemplo da mensagem, ocultando qualquer informação pessoal.

### O cálculo apareceu duplicado

Atualize para a versão mais recente e recarregue o Telegram Web com `Ctrl + F5`.

### O ícone antigo continua aparecendo

Recarregue a extensão. Se necessário, feche e abra o navegador para limpar o cache do ícone.

### A extensão parou depois de uma atualização do Telegram

O Telegram Web pode alterar a estrutura interna da página. Abra uma issue informando a versão do navegador, a URL usada (`/a/` ou `/k/`) e uma captura de tela.

## Privacidade

O Stake Reader:

- não possui servidor próprio;
- não envia mensagens do Telegram para terceiros;
- não coleta banca, gestão ou histórico de apostas;
- não realiza apostas automaticamente;
- usa o armazenamento local do navegador apenas para guardar as configurações.

Consulte também o arquivo [`PRIVACY.md`](PRIVACY.md).

## Código-fonte

Todo o código-fonte está incluído neste repositório. Os principais arquivos são:

```text
manifest.json   Configuração da extensão
stake.js        Detecção e cálculo das stakes
content.js      Integração com as mensagens do Telegram Web
content.css     Aparência dos controles sobre as mensagens
popup.html      Interface de configuração
popup.js        Lógica da interface
popup.css       Estilos da interface
icons/          Ícones e identidade visual
```

Não existem arquivos compilados ou minificados necessários para entender o funcionamento do projeto.

## Executar o código localmente

```bash
git clone https://github.com/SEU-USUARIO/telegram-stake-reader.git
cd telegram-stake-reader
```

Depois, abra a página de extensões do navegador e use **Carregar sem compactação**, selecionando a pasta clonada.

## Publicar uma nova versão

1. Atualize o campo `version` no `manifest.json`.
2. Atualize o `CHANGELOG.md`.
3. Teste no Chrome e no Edge.
4. Crie uma tag Git:

```bash
git add .
git commit -m "Release v0.1.7"
git tag v0.1.7
git push origin main --tags
```

5. No GitHub, abra **Releases** e escolha **Draft a new release**.
6. Selecione a tag criada.
7. Anexe o arquivo `.zip` da versão.
8. Publique a release.

## Contribuições

Contribuições são bem-vindas. Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de enviar um pull request.

Ao relatar um erro, informe:

- navegador e versão;
- versão do Stake Reader;
- versão do Telegram Web utilizada;
- formato da stake que não foi reconhecido;
- captura de tela sem informações pessoais.

## Aviso de responsabilidade

O Stake Reader é apenas uma ferramenta de cálculo. Ele não garante resultados, não recomenda apostas e não executa entradas automaticamente. Aposte com responsabilidade e apenas se você tiver idade legal para isso.

## Licença

Distribuído sob a licença MIT. Consulte [`LICENSE`](LICENSE).

Desenvolvido por **Guedes Betting**.

## Compatibilidade com áudio e vídeo

O Stake Reader não inicia, pausa, silencia ou altera o volume das mídias do Telegram. A leitura das apostas é feita somente nos nós de texto das mensagens, ignorando elementos `video` e `audio`.
