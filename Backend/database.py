from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

URL_DATABASE = 'mysql+pymysql://root:root@localhost:3306/documentor_AI'

engine = create_engine(URL_DATABASE)

sessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind = engine
    )

Base = declarative_base()