require 'socket'
require 'openssl'
require 'json'
require 'uri'
require 'base64'

class WebSocketClient
  attr_reader :url, :host, :port

  def initialize(url, headers = [])
    @url = url
    @params_header = headers
    uri = URI.parse(url)
    @host = uri.host
    @port = uri.port || (uri.scheme == 'wss' ? 443 : 80)
    @ssl = uri.scheme == 'wss'

    @socket = TCPSocket.new(@host, @port)
    @socket = setup_ssl(@socket) if @ssl

    handshake(uri)
  end

  def on_message(&block)
    @on_message = block
  end

  def on_close(&block)
    @on_close = block
  end

  def send_event(event, data)
    message = { event: event, data: data }.to_json
    send_frame(message)
  end

  def listen
    Thread.new do
      loop do
        begin
          frame = receive_frame
          @on_message.call(frame) if @on_message && frame
        rescue => e
          puts "Error: #{e.message}"
          @on_close.call if @on_close
          break
        end
      end
    end
  end

  def close
    @socket.close
    @on_close.call if @on_close
  end

  private

  def setup_ssl(socket)
    ssl_context = OpenSSL::SSL::SSLContext.new
    ssl_socket = OpenSSL::SSL::SSLSocket.new(socket, ssl_context)
    ssl_socket.sync_close = true
    ssl_socket.connect
    ssl_socket
  end

  def handshake(uri)
    path = uri.path.empty? ? '/' : uri.path
    key = Base64.encode64(Random.new.bytes(16)).strip

    headers = [
      "GET #{path} HTTP/1.1",
      "Host: #{@host}:#{@port}",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Sec-WebSocket-Key: #{key}",
      "Sec-WebSocket-Version: 13",
    ]

    @params_header.each do |header|
      headers << header
    end

    headers << "" << ""
    headers

    @socket.write(headers.join("\r\n"))
    response = @socket.readpartial(1024)
    unless response.include?("101 Switching Protocols")
      raise "Handshake failed: #{response}"
    end
  end

  def send_frame(data)
    frame = ""
    frame << 0x81.chr # FIN bit set and opcode 0x1 (text)
    length = data.bytesize
  
    if length <= 125
      frame << (0x80 | length).chr # MASK bit set
    elsif length <= 65535
      frame << 0xFE.chr
      frame << [length].pack("n")
    else
      frame << 0xFF.chr
      frame << [length >> 32, length & 0xFFFFFFFF].pack("NN")
    end
  
    mask_key = Array.new(4) { rand(0..255) }
    frame << mask_key.pack("C*")
  
    masked_data = data.bytes.each_with_index.map { |byte, i| byte ^ mask_key[i % 4] }
    frame << masked_data.pack("C*")
  
    @socket.write(frame)
  end

  def receive_frame
    first_byte = @socket.read(1).ord
    fin = (first_byte & 0x80) != 0
    opcode = first_byte & 0x0F

    second_byte = @socket.read(1).ord
    mask = (second_byte & 0x80) != 0
    length = second_byte & 0x7F

    if length == 126
      length = @socket.read(2).unpack("n").first
    elsif length == 127
      length = @socket.read(8).unpack("Q>").first
    end

    mask_key = mask ? @socket.read(4).bytes : nil
    payload = @socket.read(length).bytes

    if mask
      payload = payload.each_with_index.map { |byte, i| byte ^ mask_key[i % 4] }
    end

    payload.pack("C*")
  end
end

player_id = "134433894"
headers = 
# Utilisation
client = WebSocketClient.new("ws://localhost:8080", [
  "Player-ID: #{player_id}",
])

client.on_message do |message|
  data = JSON.parse(message)
  log = "Received event: #{data['event']}, data: #{data['data']}"
  if data['event'] == 'ping'
    puts "Received ping, sending pong"
    client.send_event('pong', {}) 
  else
    puts "Received event: #{data['event']}, data: #{data['data']}"
  end
end

client.on_close do
  puts "Connection closed"
end

# Exemple d'envoi et d'écoute
client.listen

client.send_event("greet", { name: "Ruby Client", boy: true })
#client.send_event("playerCreate", { name: "RatyGirl", player_id: "134433894", is_girl: true })
client.send_event("playerDelete", {  })

# Maintenir la connexion ouverte
sleep


Online::WebSocketClient.connect("ws://localhost:8080", ["Player-ID: #{$trainer.id}"])
Online::WebSocketClient.connect(headers: ["Player-ID: #{$trainer.id}"])
Online::WebSocketClient.connect()
Online::WebSocketClient.socket?
Online::WebSocketClient.close


Online::WebSocketClient.emit("playerCreate", { id: $trainer.id.to_s, name: $trainer.name, is_girl: $trainer.playing_girl })
Online::WebSocketClient.emit("playerCreate", { id: $trainer.id.to_s, name: $trainer.name, is_girl: $trainer.playing_girl }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("playerUpdate", { name: "Ota", isGirl: false } ) { |response| puts "Réponse reçue : #{response}" }


Online::WebSocketClient.emit("playerDelete", {})
Online::WebSocketClient.emit("playerDelete", {}) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("giftList", {})
Online::WebSocketClient.emit("giftList", {}) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("giftClaim", {})
Online::WebSocketClient.emit("giftClaim", { code: "Otaa" }) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("gtsAdd", {})
Online::WebSocketClient.emit("gtsAdd", { creature: $actors[0].instance_variables.to_h { |var| [var.to_s.delete('@').to_sym, $actors[0].instance_variable_get(var)] }, forbid_conditions: { db_symbol: 'mew', level: {min: 50}} }) { |response| puts "Réponse reçue : #{response}" }


Online::WebSocketClient.emit("gtsTrade", {})
Online::WebSocketClient.emit("gtsTrade", { 
  playerA_id: player_a_id,
  offeredCreature: { 
    species: $actors[2].db_symbol, 
    level: $actors[2].level, 
    shiny: false, 
    form: $actors[2].form, 
    nature: $actors[2].nature[0], 
    data: $actors[2].inspect 
  }
}) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("gtsTrade", { playerA_id: player_a_id,offeredCreature: { species: $actors[2].db_symbol, level: $actors[2].level, shiny: false, form: $actors[2].form, nature: $actors[2].nature[0], data: $actors[2].inspect }}) { |response| puts "Réponse reçue : #{response}" }

Online::PlayerManager.create_player

Online::WebSocketClient.emit("gtsTrade", { playerA_id: $trainer.id.to_s, offeredCreature: { species: $actors[1].db_symbol, level: $actors[1].level, shiny: false, form: $actors[1].form, nature: $actors[1].nature[0], data: $actors[1].inspect }}) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("gtsAllList", { 
  player_id: $trainer.id.to_s, 
  filters: { 
    species: $actors[1].db_symbol, 
    level: { min: 1, max: $actors[1].level }, 
    shiny: false, 
    form: $actors[1].form, 
    nature: $actors[1].nature[0]
  }
}) { |response| puts "Réponse reçue : #{response}" }

Online::WebSocketClient.emit("gtsAllList", { player_id: $trainer.id.to_s, filters: { species: 'pikachu' } }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("gtsAllList", { species: 'pikachu' }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("gtsAllList", { species: 'rayquaza' }) { |response| puts "Réponse reçue : #{response}" }


Online::WebSocketClient.emit("friendRequest", { toFriendCode: "jxh86x4z" }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("friendAccept", { senderId: "1064788393" }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("friendDecline", { senderId: "1064788393" }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("friendRemove", { friendId: "1064788393" }) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("friendPending", {}) { |response| puts "Réponse reçue : #{response}" }
Online::WebSocketClient.emit("friendList", {}) { |response| puts "Réponse reçue : #{response}" }
#$game_system.map_interpreter.add_specific_pokemon