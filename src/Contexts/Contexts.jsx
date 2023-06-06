import { createContext, useState } from "react";

export const GamePinContext = createContext();
export const NameContext = createContext();
export const GameContext = createContext();
export const TimerContext = createContext();
export const StartContext = createContext();
export const ExperienceContext = createContext();

export const ContextProvider = ({ children }) => {
  const [gamePin, updateGamePin] = useState("");
  const [name, updateName] = useState("");
  const [game, updateGame] = useState([]);
  const [start, setStart] = useState(false);
  const [timer, updateTimer] = useState(0);
  
  const [experience, setExperience] = useState(null);

  return (
    <ExperienceContext.Provider value={{ experience, setExperience }}>
      <GamePinContext.Provider value={{ gamePin, updateGamePin }}>
          <NameContext.Provider value={{ name, updateName }}>
            <GameContext.Provider value={{ game, updateGame }}>
              <StartContext.Provider value={{ start, setStart }}>
                <TimerContext.Provider value={{ timer, updateTimer }}>
                  {children}
                </TimerContext.Provider>
              </StartContext.Provider>
            </GameContext.Provider>
          </NameContext.Provider>
      </GamePinContext.Provider>
    </ExperienceContext.Provider>
  );
};