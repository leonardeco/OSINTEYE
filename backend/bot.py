import os
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from database import SessionLocal
import ai_service

# Your Telegram Bot Token. For security, we load this from the environment.
# You can set this variable in your system: export TELEGRAM_BOT_TOKEN="your-token"
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "PUT_YOUR_TOKEN_HERE")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_message = (
        "¡Hola! Soy tu Asistente OSINTOJO 👁️\n\n"
        "Puedo ayudarte a encontrar herramientas OSINT en el catálogo.\n"
        "Dime, ¿qué tipo de investigación quieres realizar?"
    )
    await update.message.reply_text(welcome_message)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text
    
    # Send a typing indicator while processing
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')
    
    db = SessionLocal()
    try:
        # Get AI Response
        response = ai_service.get_ai_response(db, user_message)
        await update.message.reply_text(response, parse_mode='Markdown')
    except Exception as e:
        await update.message.reply_text(f"Ocurrió un error al procesar tu solicitud: {e}")
    finally:
        db.close()

def main():
    if TELEGRAM_BOT_TOKEN == "PUT_YOUR_TOKEN_HERE":
        print("ADVERTENCIA: No has configurado TELEGRAM_BOT_TOKEN.")
        print("Puedes establecerlo con: set TELEGRAM_BOT_TOKEN=tu_token_aqui")
        # In a real scenario you would exit, but we allow starting for testing
        
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Commands
    application.add_handler(CommandHandler("start", start_command))
    
    # Messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("Iniciando Bot de Telegram de OSINTOJO...")
    application.run_polling()

if __name__ == '__main__':
    main()
