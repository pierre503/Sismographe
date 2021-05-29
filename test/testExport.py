from sismic.io import import_from_yaml
from sismic.interpreter import Interpreter
import os

def testnewElevator():
    print("Test de newElevator")
    initial = ['active', 'floorListener', 'movingElevator', 'doorsOpen', 'floorSelecting']
    firstEvent = ['floorSelected']

    elevator = import_from_yaml(filepath='results/newElevator.yaml')

    interpreter = Interpreter(elevator)

    print("Validation Sismic OK")

    step = interpreter.execute_once()

    assert set(interpreter.configuration) == set(initial)

    print("Etats de départ OK")

    assert set(elevator.events_for(interpreter.configuration)) == set(firstEvent)

    print("Evénement de départ OK")
     
    assert interpreter.context['current'] == 0

    interpreter.queue('floorSelected', floor=4)
    interpreter.execute()

    assert interpreter.context['current'] == 4

    assert set(interpreter.configuration) == set(initial)

    interpreter.queue('floorSelected', floor=0)
    step = interpreter.execute_once()

    assert set(interpreter.configuration) == set(['active', 'floorListener', 'movingElevator', 'doorsOpen', 'floorSelecting'])

    interpreter.execute()

    print("Dépalcement de l'ascenseur OK")

    assert set(elevator.events_for(interpreter.configuration)) == set(firstEvent)
    print("Evénement OK")

    print("Test de newElevator OK")


def testupdateElevator():
    print("Test de updateElevator")
    initial = ['active', 'floorListener', 'movingElevator', 'doorsOpen', 'floorSelecting']
    firstEvent = ['floorSelected']

    elevator = import_from_yaml(filepath='results/updateElevator.yaml')

    interpreter = Interpreter(elevator)

    print("Validation Sismic OK")

    step = interpreter.execute_once()

    assert set(interpreter.configuration) == set(initial)

    print("Etats de départ OK")

    assert set(elevator.events_for(interpreter.configuration)) == set(firstEvent)

    print("Evénement de départ OK")
     
    assert interpreter.context['current'] == 0

    interpreter.queue('floorSelected', floor=4)
    interpreter.execute()

    assert interpreter.context['current'] == 4

    assert set(interpreter.configuration) == set(initial)

    interpreter.queue('floorSelected', floor=0)
    step = interpreter.execute_once()

    assert set(interpreter.configuration) == set(['active', 'floorListener', 'movingElevator', 'doorsOpen', 'floorSelecting'])

    interpreter.execute()

    print("Dépalcement de l'ascenseur OK")

    assert set(elevator.events_for(interpreter.configuration)) == set(firstEvent)
    print("Evénement OK")

    print("Test de updateElevator OK")




if __name__ == "__main__":
    testnewElevator()
    print("\n\n\n\n\n\n")
    testupdateElevator()
    print("\n\n\n\n\n\n")
    stream = os.popen('sismic-bdd results/elevator.yaml --features results/elevator.feature')
    output = stream.read()
    print(output)
